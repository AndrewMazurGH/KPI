from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.functions import col

if __name__ == "__main__":
    # Ініціалізація SparkSession
    spark = SparkSession.builder.appName("JSONStreamingApp").getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")
    
    # Визначення схеми для потокових даних
    stream_schema = StructType([
        StructField("id", IntegerType(), True),
        StructField("Entity", StringType(), True),
        StructField("Code", StringType(), True),
        StructField("LifeExpectancy", DoubleType(), True),
        StructField("random_value", DoubleType(), True),
        StructField("timestamp", TimestampType(), True)
    ])
    
    # Шлях до статичного CSV-файлу
    static_csv_path = "./static_data/life_expectancy_different_ages.csv"
    
    # Каталог для потокових даних
    streaming_data_dir = "./streaming_data/"
    
    # Читання статичного DataFrame
    static_df = spark.read.format("csv") \
        .option("header", "true") \
        .option("inferSchema", "true") \
        .load(static_csv_path)
    
    # Читання потокового DataFrame
    stream_df = spark.readStream.format("json") \
        .schema(stream_schema) \
        .option("maxFilesPerTrigger", 1) \
        .load(streaming_data_dir)
    
    # Об'єднання за Entity та Code
    joined_df = stream_df.join(static_df, on=["Entity", "Code"], how="inner")
    
    # Запис результату у файл
    query = joined_df.writeStream \
        .outputMode("append") \
        .format("json") \
        .option("path", "./output_data/") \
        .option("checkpointLocation", "./checkpoint/") \
        .start()
    
    query.awaitTermination()
