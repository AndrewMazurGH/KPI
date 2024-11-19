import os
import time
import threading
import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    IntegerType,
    DoubleType,
)
from pyspark.sql.functions import col


def simulate_streaming_data(csv_datafile, input_dir, max_rows_per_country, delay):
    os.makedirs(input_dir, exist_ok=True)

    # Видаляємо існуючі файли
    for filename in os.listdir(input_dir):
        file_path = os.path.join(input_dir, filename)
        if os.path.isfile(file_path):
            os.unlink(file_path)

    df = pd.read_csv(csv_datafile)

    grouped = df.groupby("Entity")

    chunk_counter = 0
    for entity, group in grouped:
        chunk = group.head(max_rows_per_country)
        chunk_file = os.path.join(input_dir, f"chunk_{chunk_counter}.csv")
        chunk.to_csv(chunk_file, index=False)
        print(f"Записано {chunk_file} для країни {entity}")
        time.sleep(delay)
        chunk_counter += 1


def start_streaming_app(input_dir, schema):
    spark = SparkSession.builder.appName("CSVStreamReader").getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")

    df = (
        spark.readStream.format("csv")
        .option("header", "true")
        .schema(schema)
        .load(input_dir)
    )

    processed_countries = set()

    def process_batch(df, epoch_id):
        nonlocal processed_countries 
        current_countries = set(
            row["Entity"] for row in df.select("Entity").distinct().collect()
        )

        new_countries = current_countries - processed_countries

        if new_countries:
            
            processed_countries.update(new_countries)
            new_country_df = df.filter(col("Entity").isin(new_countries))

            processed_df = new_country_df.select(
                "Entity",
                "Code",
                "Year",
                "LifeExpectancy0",
                "LifeExpectancy10",
                "LifeExpectancy25",
            )

            rows_per_country = processed_df.groupBy("Entity").count().collect()

            print(f"-------------------------------------------")
            print(f"Batch: {epoch_id}")
            print("Processed Data:")
            processed_df.show(truncate=False)
            print("Кількість слів для країни")
            for row in rows_per_country:
                print(f"{row['Entity']}: {row['count']} рядків")
        else:
            print(f"Batch: {epoch_id} - No new countries to process.")

    query = df.writeStream.outputMode("append").foreachBatch(process_batch).start()

    # Очікування завершення запиту
    try:
        query.awaitTermination()
    except KeyboardInterrupt:
        print("Зупинка стрімінгового запиту...")
        query.stop()
        print("Стрімінговий запит зупинено.")


if __name__ == "__main__":
    csv_datafile = (
        "./BigData/data_storage/lab3/datafile/life_expectancy_different_ages.csv"
    )
    input_dir = "./BigData/data_storage/lab3/input_directory"
    max_rows_per_country = 100
    delay = 10

    schema = StructType(
        [
            StructField("Entity", StringType(), True),
            StructField("Code", StringType(), True),
            StructField("Year", IntegerType(), True),
            StructField("LifeExpectancy0", DoubleType(), True),
            StructField("LifeExpectancy10", DoubleType(), True),
            StructField("LifeExpectancy25", DoubleType(), True),
            StructField("LifeExpectancy45", DoubleType(), True),
            StructField("LifeExpectancy65", DoubleType(), True),
            StructField("LifeExpectancy80", DoubleType(), True),
        ]
    )

    # Запускаємо симуляцію потокового введення в окремому потоці
    threading.Thread(
        target=simulate_streaming_data,
        args=(csv_datafile, input_dir, max_rows_per_country, delay),
    ).start()

    # Запускаємо стрімінговий додаток
    start_streaming_app(input_dir, schema)
