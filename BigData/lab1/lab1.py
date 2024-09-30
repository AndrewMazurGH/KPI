from pyspark.sql import SparkSession
from pyspark.sql.functions import col, desc

spark = SparkSession.builder.appName("FrogsAnalysis").getOrCreate()

df = spark.read.csv("./BigData/data_storage/frogs.csv", header=True, inferSchema=True)

print("Схема DataFrame:")
df.printSchema()

print("\nПерші рядки DataFrame:")
df.show(5)

# Завдання на здачі лаби. Знайти максимальну висоту, на якій спостерігаються жаби
max_altitude_presense = (
    df.filter(df["`pres.abs`"] == 0).agg({"altitude": "max"}).collect()[0][0]
)
print(f"Максимальна висота, на якій присутні жаби: {max_altitude_presense}")

# Знайти максимальну висоту, на якій спостерігаються жаби
max_altitude = df.agg({"altitude": "max"}).collect()[0][0]
print(f"1. Максимальна висота, на якій спостерігаються жаби: {max_altitude}")

# Вивести всі висоти, де середні максимальні температури не перевищують 14 градусів і на яких спостерігались жаби
heights_with_frogs = (
    df.filter((col("meanmax") <= 14) & (col("`pres.abs`") == 0))
    .select("altitude")
    .distinct()
    .orderBy("altitude")
)
print(
    "2. Висоти, де середні максимальні температури не перевищують 14 градусів і спостерігались жаби:"
)
heights_with_frogs.show(truncate=False)

# Відсортувати місця, де спостерігались жаби, за відстанню до найближчого поселення (спадаючий порядок)
places_with_frogs = (
    df.filter(col("`pres.abs`") == 0)
    .select("northing", "easting", "distance")
    .orderBy(desc("distance"))
)
print(
    "3. Місця, де спостерігались жаби, відсортовані за відстанню до найближчого поселення (спадаючий порядок):"
)
places_with_frogs.show()

# Порахувати загальну кількість груп для розмноження
total_breeding_sites = df.agg({"NoOfSites": "sum"}).collect()[0][0]
print(f"4. Загальна кількість груп для розмноження: {total_breeding_sites}")

spark.stop()
