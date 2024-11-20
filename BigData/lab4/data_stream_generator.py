import time
import json
import pandas as pd
import os
from datetime import datetime
import random

def generate_streaming_data(input_csv, output_dir, interval=10):
    # Завантажуємо дані з основного CSV-файлу
    data = pd.read_csv(input_csv)
    
    # Ініціалізуємо індекс для відстеження позиції
    index = 0
    total_rows = len(data)
    
    while index < total_rows:
        # Вибираємо наступний рядок даних
        row = data.iloc[index]
        
        # Створюємо JSON-об'єкт з необхідними полями
        data_dict = {
            "id": index,
            "Entity": row['Entity'],
            "Code": row['Code'],
            "LifeExpectancy": row[random.choice([
                'LifeExpectancy0',
                'LifeExpectancy10',
                'LifeExpectancy25',
                'LifeExpectancy45',
                'LifeExpectancy65',
                'LifeExpectancy80'
            ])],
            "random_value": random.uniform(10, 90), 
            "timestamp": datetime.now().isoformat()
        }
        
        # Записуємо його в новий JSON-файл
        output_file = os.path.join(output_dir, f"data_{index}.json")
        with open(output_file, 'w') as f:
            json.dump(data_dict, f)
        
        print(f"Додано файл: {output_file}")
        
        # Збільшуємо індекс та чекаємо інтервал
        index += 1
        time.sleep(interval)

if __name__ == "__main__":
    input_csv = "./static_data/life_expectancy_different_ages.csv" 
    output_dir = "./streaming_data/"
    os.makedirs(output_dir, exist_ok=True)
    
    generate_streaming_data(input_csv, output_dir)
