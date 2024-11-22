from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.functions import col, sum, when, avg, min, max
import pyspark.sql.functions as F
from pyspark.ml.feature import (
    Bucketizer, QuantileDiscretizer, StandardScaler, MinMaxScaler,
    MaxAbsScaler, VectorAssembler, StringIndexer, VectorIndexer,
    Tokenizer, StopWordsRemover, CountVectorizer
)

# Ініціалізація SparkSession
spark = SparkSession.builder.appName("PreprocessingLab").getOrCreate()
spark.sparkContext.setLogLevel("ERROR")

# Визначення схеми
schema = StructType([
    StructField("Entity", StringType(), True),
    StructField("Code", StringType(), True),
    StructField("Year", IntegerType(), True),
    StructField("LifeExpectancy0", DoubleType(), True),
    StructField("LifeExpectancy10", DoubleType(), True),
    StructField("LifeExpectancy25", DoubleType(), True),
    StructField("LifeExpectancy45", DoubleType(), True),
    StructField("LifeExpectancy65", DoubleType(), True),
    StructField("LifeExpectancy80", DoubleType(), True)
])

# Завантаження даних
static_csv_path = "./data/life_expectancy_different_ages.csv"
df = spark.read.format("csv") \
    .option("header", "true") \
    .schema(schema) \
    .load(static_csv_path)

# Перевірка та обробка null-значень
numeric_cols = ["LifeExpectancy0", "LifeExpectancy10", "LifeExpectancy25",
               "LifeExpectancy45", "LifeExpectancy65", "LifeExpectancy80"]

# Виведення статистики перед обробкою
print("Статистика даних перед обробкою:")
df.select([
    F.min("LifeExpectancy0").alias("min"),
    F.max("LifeExpectancy0").alias("max"),
    F.avg("LifeExpectancy0").alias("avg")
]).show()

null_counts = df.select([sum(when(col(c).isNull(), 1).otherwise(0)).alias(c) for c in numeric_cols])
null_counts.show()

# Заповнення null-значень середніми значеннями
filled_df = df
for col_name in numeric_cols:
    avg_val = df.select(F.avg(col(col_name))).collect()[0][0]
    filled_df = filled_df.withColumn(col_name, F.coalesce(col(col_name), F.lit(avg_val)))

# Отримання min/max значень для Bucketizer
min_max = filled_df.agg(
    F.min("LifeExpectancy0").alias("min"),
    F.max("LifeExpectancy0").alias("max")
).collect()[0]

# Налаштування меж для Bucketizer
bucketBorders = [25.0, 35.0, 45.0, 55.0, 65.0]

# 1. Групування за Bucketizer
bucketer = Bucketizer(
    splits=bucketBorders,
    inputCol="LifeExpectancy0",
    outputCol="LifeExpectancy0_Bucket",
    handleInvalid="keep"
)
bucketed_df = bucketer.transform(filled_df)
print("\nРезультати групування Bucketizer:")
bucketed_df.select("LifeExpectancy0", "LifeExpectancy0_Bucket").show(10)

# 2. Групування за QuantileDiscretizer
discretizer = QuantileDiscretizer(
    numBuckets=5,
    inputCol="LifeExpectancy0",
    outputCol="LifeExpectancy0_Quantile",
    handleInvalid="keep"
)
fitted_discretizer = discretizer.fit(filled_df)
discretized_df = fitted_discretizer.transform(filled_df)
print("\nРезультати групування QuantileDiscretizer:")
discretized_df.select("LifeExpectancy0", "LifeExpectancy0_Quantile").show(10)

# 3. Масштабування даних
assembler = VectorAssembler(inputCols=numeric_cols, outputCol="features")
assembled_df = assembler.transform(filled_df)

# StandardScaler
scaler = StandardScaler(
    inputCol="features",
    outputCol="scaledFeatures",
    withStd=True,
    withMean=True
)
scalerModel = scaler.fit(assembled_df)
scaled_df = scalerModel.transform(assembled_df)
print("\nРезультати StandardScaler:")
scaled_df.select("features", "scaledFeatures").show(5, truncate=False)

# MinMaxScaler
minMaxScaler = MinMaxScaler(inputCol="features", outputCol="minMaxScaledFeatures")
minMaxScalerModel = minMaxScaler.fit(assembled_df)
minMaxScaled_df = minMaxScalerModel.transform(assembled_df)
print("\nРезультати MinMaxScaler:")
minMaxScaled_df.select("features", "minMaxScaledFeatures").show(5, truncate=False)

# MaxAbsScaler
maxAbsScaler = MaxAbsScaler(inputCol="features", outputCol="maxAbsScaledFeatures")
maxAbsScalerModel = maxAbsScaler.fit(assembled_df)
maxAbsScaled_df = maxAbsScalerModel.transform(assembled_df)
print("\nРезультати MaxAbsScaler:")
maxAbsScaled_df.select("features", "maxAbsScaledFeatures").show(5, truncate=False)

# 4. Перетворення категоріальних даних
indexer_entity = StringIndexer(
    inputCol="Entity",
    outputCol="Entity_Index",
    handleInvalid="keep"
)
indexer_code = StringIndexer(
    inputCol="Code",
    outputCol="Code_Index",
    handleInvalid="keep"
)

indexed_entity_df = indexer_entity.fit(filled_df).transform(filled_df)
indexed_df = indexer_code.fit(indexed_entity_df).transform(indexed_entity_df)
print("\nРезультати StringIndexer:")
indexed_df.select("Entity", "Entity_Index", "Code", "Code_Index").show(5)

# 5. Обробка текстових даних
text_df = spark.createDataFrame([
    (0, "Life expectancy in different countries varies significantly."),
    (1, "Healthcare improvements lead to longer life expectancy."),
    (2, "Economic factors affect population health outcomes.")
], ["id", "Description"])

# Токенізація
tokenizer = Tokenizer(inputCol="Description", outputCol="words")
tokenized_df = tokenizer.transform(text_df)
print("\nРезультати токенізації:")
tokenized_df.select("Description", "words").show(truncate=False)

# Видалення стоп-слів
remover = StopWordsRemover(inputCol="words", outputCol="filtered_words")
filtered_df = remover.transform(tokenized_df)
print("\nРезультати після видалення стоп-слів:")
filtered_df.select("words", "filtered_words").show(truncate=False)

# CountVectorizer
cv = CountVectorizer(
    inputCol="filtered_words",
    outputCol="features",
    vocabSize=100,
    minDF=1.0
)
cv_model = cv.fit(filtered_df)
vectorized_df = cv_model.transform(filtered_df)
print("\nРезультати CountVectorizer:")
vectorized_df.select("filtered_words", "features").show(truncate=False)

spark.stop()