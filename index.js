
import 'dotenv/config';
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";
import winston from "winston";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  OPENROUTER_KEY: process.env.OPENROUTER_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL,
  MAX_TOKENS_INTENT: 8,
  MAX_TOKENS_ANSWER: 300,
  REQUEST_TIMEOUT: 30000,
  PORT: process.env.PORT || 5000,
  PYTHON_TIMEOUT: process.env.PYTHON_TIMEOUT ? parseInt(process.env.PYTHON_TIMEOUT) : 1200000 //
};

// Validate required environment variables
if (!CONFIG.OPENROUTER_KEY) {
  console.error('OPENROUTER_API_KEY environment variable is required');
  process.exit(1);
}

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ 
      format: winston.format.simple(),
      level: process.env.NODE_ENV === 'production' ? 'error' : 'info'
    })
  ]
});

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["POST", "GET", "OPTIONS"],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/answer', limiter);
app.use('/predict', limiter);

// Python assets paths
const MODEL_PATH = path.join(__dirname, "python", "Political_god1.pkl");
const VECTORIZER_PATH = path.join(__dirname, "python", "vectorizer_god1.pkl");
const PYTHON_SCRIPT = path.join(__dirname, "python", "predict.py");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Input sanitization
function sanitizeInput(query) {
  if (!query || typeof query !== 'string') return '';
  return query.trim().slice(0, 10000); // Prevent extremely long inputs
}

// Standardized response format
function createResponse(type, data, metadata = {}) {
  return {
    success: true,
    type,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  };
}

function createErrorResponse(error, statusCode = 500) {
  return {
    success: false,
    error: error.message || error,
    statusCode, // include statusCode for clarity
    timestamp: new Date().toISOString()
  };
}

// Enhanced heuristic intent detection for subjective vs objective claims
function quickIntentCheck(query) {
  const qLower = query.toLowerCase();
  
  // Strong indicators for SUBJECTIVE/OPINION claims (need ML classification)
  const subjectivePatterns = [
    // Opinion/judgment words
    /(is|are|was|were).+\b(liar|corrupt|good|bad|evil|great|terrible|stupid|smart|honest|dishonest)/,
    /(is|are|was|were).+\b(best|worst|better|worse|amazing|awful|fantastic|horrible)/,
    // Controversial claims
    /(is|are|was|were).+\b(criminal|thief|murderer|terrorist|traitor|hero|villain)/,
    // Subjective qualities
    /(is|are|was|were).+\b(beautiful|ugly|handsome|attractive|fat|thin)/,
    // Performance judgments
    /(is|are|was|were).+\b(incompetent|useless|brilliant|genius|failure|success)/,
    // Explicit fact-checking requests
    /is (this|it|that) (true|false|fake|real|accurate)/,
    /(fact.?check|verify|debunk)/,
    /(fake news|hoax|misinformation|disinformation)/,
    /^(true or false|fact or fiction)/
  ];
  
  // Strong indicators for OBJECTIVE/FACTUAL claims (can be answered by LLM)
  const objectivePatterns = [
    // Basic identity/classification
    /(is|are|was|were).+\b(human|person|man|woman|politician|minister|president|leader)/,
    /(is|are|was|were).+\b(indian|american|chinese|from|born in|lives in)/,
    // Factual roles/positions
    /(is|are|was|were).+\b(prime minister|president|ceo|director|member of)/,
    // Basic facts
    /(is|are|was|were).+\b(alive|dead|married|single|old|young)$/,
    // Simple definitions
    /^what (is|are|was|were)/,
    /^who (is|are|was|were)/,
    /^when (did|was|were)/,
    /^where (is|are|was|were)/,
    // Age, dates, basic info
    /(how old|when born|birth date|age)/,
    // Simple yes/no factual questions
    /(is|are).+\b(capital|currency|language|religion|party|member)/
  ];
  
  // Check for long content first (simple length check)
  if (query.length > 800) {
    return "CLASSIFY_NEWS";
  }
  
  // Check subjective patterns first (higher priority)
  for (const pattern of subjectivePatterns) {
    try {
      if (pattern.test(qLower)) {
        return "CLASSIFY_NEWS";
      }
    } catch (error) {
      logger.warn('Invalid regex pattern in subjectivePatterns:', error.message);
      continue;
    }
  }
  
  // Then check objective patterns
  for (const pattern of objectivePatterns) {
    try {
      if (pattern.test(qLower)) {
        return "SIMPLE_FACT";
      }
    } catch (error) {
      logger.warn('Invalid regex pattern in objectivePatterns:', error.message);
      continue;
    }
  }
  
  // If unclear, let LLM decide
  return null;
}

// LLM call with retry logic
async function callLLMWithRetry(body, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
      
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CONFIG.OPENROUTER_KEY}`,
          "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
          "X-Title": "TruthSite",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
      
      // Retry on server errors (5xx)
      if (response.status >= 500 && attempt < maxRetries - 1) {
        logger.warn(`LLM API server error ${response.status}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      
      throw new Error(`LLM API error ${response.status}: ${await response.text()}`);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      logger.warn(`LLM API attempt ${attempt + 1} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
}

// Intent detection using LLM with focused prompt
async function detectIntentLLM(query) {
  const system = `Classify if this statement needs fact-checking (subjective/opinion) or is a simple factual question:

CLASSIFY_NEWS: Subjective claims, opinions, judgments, controversial statements, accusations, or claims that could be misinformation
SIMPLE_FACT: Objective facts, basic information, definitions, clear factual statements

Examples:
"Modi is corrupt" → CLASSIFY_NEWS (opinion/accusation)
"Biden is a liar" → CLASSIFY_NEWS (opinion/accusation)  
"Modi is the Prime Minister of India" → SIMPLE_FACT (verifiable fact)
"What is the capital of France?" → SIMPLE_FACT (factual question)

Respond with exactly: CLASSIFY_NEWS or SIMPLE_FACT`;

  const body = {
    model: CONFIG.LLM_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: query }
    ],
    temperature: 0.0,
    max_tokens: CONFIG.MAX_TOKENS_INTENT
  };

  const result = await callLLMWithRetry(body);
  return (result.choices?.[0]?.message?.content || "").trim();
}

// Simple fact answering via LLM
async function answerSimpleFact(query) {
  const system = `You are a factual assistant. For every question, do the following:
1. Start your answer with one of these labels (in all caps), followed by a colon:
   - REAL: if the statement is factually correct or true
   - FAKE: if the statement is factually incorrect or false
   - NEUTRAL: if the statement is ambiguous, cannot be verified, or is not clearly true or false
2. After the label, give a concise factual answer (1-2 sentences).
3. Then, in a new sentence, briefly explain (in 2-3 sentences max) why you classified it as REAL, FAKE, or NEUTRAL. The explanation should be short and based on facts or lack of evidence.

Format your response like this:
REAL: [factual answer]. Explanation: [short justification]
FAKE: [factual answer]. Explanation: [short justification]
NEUTRAL: [factual answer]. Explanation: [short justification]

Example outputs:
REAL: Paris is the capital of France. Explanation: This is a well-established and widely recognized fact in geography.
FAKE: The moon is made of cheese. Explanation: Scientific evidence shows the moon is composed of rock and dust, not cheese.
NEUTRAL: There is not enough information to determine the truth of this statement. Explanation: The claim is too vague or lacks sufficient evidence for verification.

Now answer the user's question accordingly.`;

  const body = {
    model: CONFIG.LLM_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: query }
    ],
    temperature: 0.2,
    max_tokens: CONFIG.MAX_TOKENS_ANSWER
  };

  const result = await callLLMWithRetry(body);
  return result.choices?.[0]?.message?.content?.trim() ?? "";
}

// Get explanation from LLM for a verdict and query
async function getLLMExplanation(verdict, query) {
  const system = `You are a factual assistant. Given a verdict (REAL, FAKE, or NEUTRAL) about a statement, briefly explain (2-3 sentences max) why this verdict is appropriate. Be concise and factual.`;
  const user = `Statement: "${query}"\nVerdict: ${verdict}\nExplain why this verdict is appropriate.`;

  const body = {
    model: CONFIG.LLM_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.2,
    max_tokens: 120
  };

  const result = await callLLMWithRetry(body);
  return result.choices?.[0]?.message?.content?.trim() ?? "";
}

// Python classifier with improved error handling
function classifyWithPython(inputText) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", [
      PYTHON_SCRIPT,
      MODEL_PATH,
      VECTORIZER_PATH,
      JSON.stringify(inputText),
    ], {
      timeout: CONFIG.PYTHON_TIMEOUT,
      killSignal: 'SIGKILL'
    });

    let result = "";
    let error = "";

    const timeout = setTimeout(() => {
      py.kill('SIGKILL');
      reject(new Error('Python process timeout'));
    }, CONFIG.PYTHON_TIMEOUT);

    py.stdout.on("data", (data) => { 
      result += data.toString(); 
    });
    
    py.stderr.on("data", (data) => { 
      error += data.toString(); 
    });

    py.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        logger.error('Python process error:', error);
        reject(new Error(`Python classification failed: ${error || `Exit code ${code}`}`));
      } else {
        try {
          const parsedResult = result.trim();
          resolve(parsedResult);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      }
    });

    py.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Main unified endpoint
app.post("/answer", async (req, res) => {
  const startTime = Date.now();
  let intent = null;
  
  try {
    const userQuery = sanitizeInput(req.body?.query);
    if (!userQuery) {
      return res.status(400).json(createErrorResponse("Query is required and cannot be empty", 400));
    }

    logger.info('Processing query', { 
      queryLength: userQuery.length, 
      queryPreview: userQuery.slice(0, 100) 
    });

    // Quick heuristic check first (free)
    intent = quickIntentCheck(userQuery);
    
    // If heuristic is uncertain, use LLM for intent detection
    if (!intent) {
      logger.info('Using LLM for intent detection');
      intent = await detectIntentLLM(userQuery);
    }

    logger.info('Intent determined', { intent });

    let responseData;
    if (intent === "CLASSIFY_NEWS") {
      logger.info('Routing to ML classification');
      const prediction = await classifyWithPython(userQuery);
      const verdict = prediction.trim().toUpperCase();
      let verdictForLLM = "";
      if (verdict === "REAL") verdictForLLM = "Real";
      else if (verdict === "FAKE") verdictForLLM = "Fake";
      else if (verdict === "NEUTRAL") verdictForLLM = "Neutral";

      if (verdictForLLM) {
        // Ask LLM for explanation for the ML verdict
        logger.info('Requesting LLM explanation for ML verdict', { verdictForLLM, userQuery });
        const system = `You are a fact-checking assistant. Given a news claim/headline and a verdict (Real, Fake, or Neutral) from an ML model, briefly explain (in 2-3 sentences) why the model might have classified it that way. Focus on patterns, wording, or cues in the statement that could influence the verdict.`;
        const user = `Claim: "${userQuery}"\nML Verdict: ${verdictForLLM}\nWhy might the model classify it this way?`;

        const body = {
          model: CONFIG.LLM_MODEL,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          temperature: 0.2,
          max_tokens: 120
        };

        let explanation = "";
        try {
          const llmResult = await callLLMWithRetry(body);
          explanation = llmResult.choices?.[0]?.message?.content?.trim() ?? "";
          logger.info('LLM explanation received', { explanation });
        } catch (llmError) {
          logger.error('LLM explanation failed', { error: llmError.message });
          explanation = "Could not generate explanation from this.";
        }

        responseData = createResponse('classification', { 
          verdict,
          explanation
        }, { 
          model: 'python-ml+llm-explanation',
          processingTime: Date.now() - startTime
        });
      } else {
        logger.error('ML model did not return a valid verdict:', { prediction });
        responseData = createResponse('classification', { 
          verdict: "UNKNOWN",
          explanation: "The ML model did not return a valid verdict."
        }, { 
          model: 'python-ml',
          processingTime: Date.now() - startTime
        });
      }
    } else {
      // Route to LLM for objective factual questions
      logger.info('Routing to LLM for factual answer');
      const answer = await answerSimpleFact(userQuery);
      // Parse verdict and explanation from LLM answer
      let verdict = "NEUTRAL";
      let explanation = "";
      let answerText = answer;
      const verdictMatch = answer.match(/^(REAL|FAKE|NEUTRAL):/i);
      if (verdictMatch) {
        verdict = verdictMatch[1].toUpperCase();
        // Split answer and explanation
        const parts = answer.split(/Explanation:/i);
        answerText = parts[0].replace(/^(REAL|FAKE|NEUTRAL):/i, "").trim();
        explanation = (parts[1] || "").trim();
      }
      responseData = createResponse('answer', { 
        verdict,
        answer: answerText,
        explanation
      }, { 
        model: CONFIG.LLM_MODEL,
        processingTime: Date.now() - startTime
      });
    }

    logger.info('Request completed successfully', { 
      intent,
      duration: Date.now() - startTime 
    });

    return res.json(responseData);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Request failed', { 
      error: error.message, 
      intent,
      duration,
      stack: error.stack 
    });

    return res.status(500).json(createErrorResponse(error));
  }
});

// Direct ML classification endpoint (keeping for backward compatibility)
app.post("/predict", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const inputData = sanitizeInput(req.body?.input);
    if (!inputData) {
      return res.status(400).json(createErrorResponse("Input is required", 400));
    }

    logger.info('Direct ML prediction', { inputLength: inputData.length });

    const prediction = await classifyWithPython(inputData);
    
    logger.info('ML prediction completed', { duration: Date.now() - startTime });

    return res.json(createResponse('classification', { prediction }, {
      model: 'python-ml',
      processingTime: Date.now() - startTime
    }));

  } catch (error) {
    logger.error('Direct prediction failed', { 
      error: error.message,
      duration: Date.now() - startTime 
    });
    
    return res.status(500).json(createErrorResponse(error));
  }
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json(createErrorResponse("Internal server error"));
});

// Handle 404
app.use((req, res) => {
  res.status(404).json(createErrorResponse("Endpoint not found", 404));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(CONFIG.PORT, () => {
  logger.info(`Server running on port ${CONFIG.PORT}`);
  console.log(`Server running on port ${CONFIG.PORT}`);
});

export default app;
