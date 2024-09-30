from pyspark.sql import SparkSession
from pyspark.sql.functions import *
import time

spark = SparkSession.builder.appName("CSVReader").getOrCreate()

file_path = "./BigData/data_storage/life_expectancy_different_ages.csv"

df = (
    spark.read.format("csv")
    .option("header", "true")
    .option("inferSchema", "true")
    .load(file_path)
)

# Тимчасове табличне представлення DataFrame для використання SQL-запитами
df.createOrReplaceTempView("life_expectancy")

# Симуляція поточної обробки даних
for i in range(10):  # Обробка 10 "пакетів" умовних даних
    print(f"Batch {i+1}")

    # Виконання запиту
    result = spark.sql(
        """
        SELECT Entity, Year, LifeExpectancy0
        FROM life_expectancy
        ORDER BY RAND()
        LIMIT 5
    """
    )

    result.show()

    # Пауза для імітації інтервалу між пакетами
    time.sleep(2)

spark.stop()
