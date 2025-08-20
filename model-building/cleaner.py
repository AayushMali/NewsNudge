import pandas as pd

df = pd.DataFrame(cleaned_data)
df.to_csv("politifact", index=False)
