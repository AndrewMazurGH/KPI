from pyspark.sql import SparkSession
from pyspark.sql.types import *
from pyspark.sql.functions import col, avg
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression
from pyspark.ml.evaluation import RegressionEvaluator

# Ініціалізація SparkSession
spark = SparkSession.builder.appName("RegressionLab").getOrCreate()
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
data_path = "./data/life_expectancy_different_ages.csv"
df = spark.read.format("csv") \
    .option("header", "true") \
    .schema(schema) \
    .load(data_path)

# Перевірка null-значень
df = df.dropna(subset=["LifeExpectancy0", "Year"])

# Формування вектора ознак
feature_cols = ["Year"]  # У цьому прикладі використовуємо лише рік як ознаку
assembler = VectorAssembler(inputCols=feature_cols, outputCol="features")
df = assembler.transform(df)

# Поділ на тренувальну і тестову вибірки
train_data, test_data = df.randomSplit([0.8, 0.2], seed=42)

# Лінійна регресія - Модель 1
lr1 = LinearRegression(featuresCol="features", labelCol="LifeExpectancy0", maxIter=10, regParam=0.3, elasticNetParam=0.8)
model1 = lr1.fit(train_data)
predictions1 = model1.transform(test_data)

# Лінійна регресія - Модель 2
lr2 = LinearRegression(featuresCol="features", labelCol="LifeExpectancy0", maxIter=20, regParam=0.1, elasticNetParam=0.5)
model2 = lr2.fit(train_data)
predictions2 = model2.transform(test_data)

# Лінійна регресія - Модель 3
lr3 = LinearRegression(featuresCol="features", labelCol="LifeExpectancy0", maxIter=50, regParam=0.05, elasticNetParam=0.2)
model3 = lr3.fit(train_data)
predictions3 = model3.transform(test_data)

# Оцінка моделей
evaluator = RegressionEvaluator(labelCol="LifeExpectancy0", predictionCol="prediction", metricName="rmse")

rmse1 = evaluator.evaluate(predictions1)
rmse2 = evaluator.evaluate(predictions2)
rmse3 = evaluator.evaluate(predictions3)

print(f"RMSE for Model 1: {rmse1}")
print(f"RMSE for Model 2: {rmse2}")
print(f"RMSE for Model 3: {rmse3}")

# Вибір найкращої моделі
best_model = None
if rmse1 <= rmse2 and rmse1 <= rmse3:
    best_model = model1
    print("Model 1 is the best.")
elif rmse2 <= rmse1 and rmse2 <= rmse3:
    best_model = model2
    print("Model 2 is the best.")
else:
    best_model = model3
    print("Model 3 is the best.")

# Вивід параметрів найкращої моделі
if best_model:
    print(f"Coefficients: {best_model.coefficients}")
    print(f"Intercept: {best_model.intercept}")

# Завершення роботи Spark
spark.stop()
