import pandas as pd
import json

file_path = 'C:/Users/DELL/Desktop/Campeche/Data_xls/Indicadores/anexo 3 (8 tablas) VF.xlsx'
xl = pd.ExcelFile(file_path)

summary = {}
for sheet_name in xl.sheet_names:
    if "ndice" in sheet_name.lower():
        continue
        
    df = xl.parse(sheet_name, header=None)
    
    # Get first 15 rows, non-empty cells
    rows_info = []
    for idx, row in df.head(15).iterrows():
        non_empty = []
        for col_idx, val in enumerate(row):
            if pd.notna(val) and str(val).strip() != "":
                col_letter = chr(65 + col_idx) if col_idx < 26 else chr(64 + col_idx//26) + chr(65 + col_idx%26)
                non_empty.append(f"{col_letter}: {val}")
        if non_empty:
            rows_info.append(f"Row {idx+1}: " + " | ".join(non_empty))
            
    summary[sheet_name] = rows_info

with open('m3_summary.txt', 'w', encoding='utf-8') as f:
    for sheet, rows in summary.items():
        f.write(f"=== {sheet} ===\n")
        for row in rows:
            f.write(f"{row}\n")
        f.write("\n")
