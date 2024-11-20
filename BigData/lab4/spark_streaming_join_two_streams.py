from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.functions import expr, to_timestamp, concat_ws, lit, col

if __name__ == "__main__":
    # Ініціалізація SparkSession
    spark = SparkSession.builder.appName("TwoStreamsJoinApp").getOrCreate()
    spark.sparkContext.setLogLevel("ERROR")
    
    # Визначення схеми для потокових даних
    stream_schema = StructType([
        StructField("id", IntegerType(), True),
        StructField("Entity", StringType(), True),
        StructField("Code", StringType(), True),
        StructField("Year", IntegerType(), True),
        StructField("LifeExpectancy", DoubleType(), True),
        StructField("random_value", DoubleType(), True),
        StructField("timestamp", TimestampType(), True)
    ])
    
    # Каталоги для двох потоків даних
    streaming_data_dir_1 = "./streaming_data_stream1/"
    streaming_data_dir_2 = "./streaming_data_stream2/"
    
    # Читання першого потокового DataFrame
    stream_df1 = spark.readStream.format("json") \
        .schema(stream_schema) \
        .load(streaming_data_dir_1) \
        .withWatermark("timestamp", "1 minute")
    
    # Читання другого потокового DataFrame
    stream_df2 = spark.readStream.format("json") \
        .schema(stream_schema) \
        .load(streaming_data_dir_2) \
        .withWatermark("timestamp", "1 minute")
    
    # Об'єднання двох потоків за Entity та позначкою часу
    joined_df = stream_df1.alias("stream1").join(
        stream_df2.alias("stream2"),
        expr("""
            stream1.Entity = stream2.Entity AND
            stream1.timestamp BETWEEN stream2.timestamp - interval 1 minute AND stream2.timestamp + interval 1 minute
        """)
    )
    
    # Запис результату у файл
    query = joined_df.writeStream \
        .outputMode("append") \
        .format("json") \
        .option("path", "./output_data/") \
        .option("checkpointLocation", "./checkpoint/") \
        .start()
    
    query.awaitTermination()
