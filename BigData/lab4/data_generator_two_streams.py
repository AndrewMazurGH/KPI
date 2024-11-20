import time
import json
import pandas as pd
import os
from datetime import datetime
import random
import threading

def generate_streaming_data(input_csv, output_dir, interval=10, stream_name="Stream"):
    # Завантажуємо дані з CSV-файлу
    data = pd.read_csv(input_csv)
    
    index = 0
    total_rows = len(data)
    
    while index < total_rows:
        # Вибираємо наступний рядок даних
        row = data.iloc[index]
        
        # Створюємо JSON-об'єкт з необхідними полями
        data_dict = {
            "id": int(index),
            "Entity": row['Entity'],
            "Code": row['Code'],
            "Year": int(row['Year']),
            "LifeExpectancy": float(row[random.choice([
                'LifeExpectancy0',
                'LifeExpectancy10',
                'LifeExpectancy25',
                'LifeExpectancy45',
                'LifeExpectancy65',
                'LifeExpectancy80'
            ])]),
            "random_value": random.uniform(10, 90),  # Випадкове числове значення
            "timestamp": datetime.now().isoformat()
        }
        
        # Записуємо його в новий JSON-файл
        output_file = os.path.join(output_dir, f"data_{index}.json")
        with open(output_file, 'w') as f:
            json.dump(data_dict, f)
        
        print(f"{stream_name} - Додано файл: {output_file}")
        
        # Збільшуємо індекс та чекаємо інтервал
        index += 1
        time.sleep(interval)

if __name__ == "__main__":
    input_csv = "./static_data/life_expectancy_different_ages.csv" 
    
    # Каталоги для двох потоків даних
    output_dir_1 = "./streaming_data_stream1/"
    output_dir_2 = "./streaming_data_stream2/"
    os.makedirs(output_dir_1, exist_ok=True)
    os.makedirs(output_dir_2, exist_ok=True)
    
    # Запуск двох потоків генерації даних
    thread1 = threading.Thread(target=generate_streaming_data, args=(input_csv, output_dir_1, 5, "Stream 1"))
    thread2 = threading.Thread(target=generate_streaming_data, args=(input_csv, output_dir_2, 7, "Stream 2"))
    
    thread1.start()
    thread2.start()
    
    thread1.join()
    thread2.join()
