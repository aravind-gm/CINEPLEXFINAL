"""
Script to fix import issues before starting the application
"""
import os
import re

def fix_schemas_file():
    schemas_path = os.path.join('app', 'schemas', 'schemas.py')
    
    if not os.path.exists(schemas_path):
        print(f"Warning: Could not find {schemas_path}")
        return
    
    with open(schemas_path, 'r') as file:
        content = file.read()
    
    # Check if EmailStr is already imported
    if 'from pydantic import' in content and 'EmailStr' not in content:
        # Add EmailStr to the import
        content = re.sub(
            r'from pydantic import ([^\\n]+)',
            r'from pydantic import \1, EmailStr',
            content
        )
        
        # Write back the modified content
        with open(schemas_path, 'w') as file:
            file.write(content)
        
        print(f"Fixed EmailStr import in {schemas_path}")
    else:
        print(f"No changes needed to {schemas_path}")

if __name__ == "__main__":
    fix_schemas_file()