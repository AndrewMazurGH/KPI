from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    collect_list,
    size,
    min as spark_min,
    col,
    when,
    lit,
    max as spark_max,
)

spark = SparkSession.builder.appName("FrogsAnalysis").getOrCreate()

df = (
    spark.read.option("header", "true")
    .option("inferSchema", "true")
    .csv("./BigData/data_storage/frogs.csv")
)

print("Схема DataFrame:")
df.printSchema()


def format_output(row):
    distance = row["distance"]
    pools = row["NoOfPools"]
    pools_str = ", ".join(map(str, pools[:8]))  # Показуємо тільки перші 5 елементів
    if len(pools) > 8:
        pools_str += f", ... (+{len(pools)-8} more)"
    return f"{distance:8d} | {pools_str}"


# Завдання 1: Створення нової таблиці з двома стовпцями
distance_pools_df = (
    df.groupBy("distance")
    .agg(collect_list("NoOfPools").alias("NoOfPools"))
    .orderBy("distance")
)

# Застосування форматування та виведення результату
print(
    "\n1. Нова таблиця з відстанню та масивом кількостей можливих груп для розмноження:"
)
print("Відстань | Кількості груп для розмноження")
print("---------+-----------------------------------------------")
formatted_output = distance_pools_df.rdd.map(format_output).collect()
for line in formatted_output:
    print(line)

# Завдання 2: Перетворення другого стовпця на кілька стовпців
expanded_df = distance_pools_df.select(
    col("distance"),
    col("NoOfPools").getItem(0).alias("Pool_1"),
    col("NoOfPools").getItem(1).alias("Pool_2"),
    col("NoOfPools").getItem(2).alias("Pool_3"),
    col("NoOfPools").getItem(3).alias("Pool_4"),
    col("NoOfPools").getItem(4).alias("Pool_5"),
    col("NoOfPools").getItem(5).alias("Pool_6"),
    col("NoOfPools").getItem(6).alias("Pool_7"),
    col("NoOfPools").getItem(7).alias("Pool_8"),
    (size(col("NoOfPools")) - 8).alias("Additional_Pools"),
)

for i in range(1, 9):
    expanded_df = expanded_df.withColumn(
        f"Pool_{i}",
        when(col(f"Pool_{i}").isNull(), lit("-")).otherwise(
            col(f"Pool_{i}").cast("string")
        ),
    )

expanded_df = expanded_df.withColumn(
    "Additional_Pools",
    when(col("Additional_Pools") <= 0, "-").otherwise(
        col("Additional_Pools").cast("string")
    ),
)

# Виведення результату завдання 2
print("\n2. Таблиця з перетвореним другим стовпцем на кілька стовпців:")
expanded_df.show(truncate=False)

# Завдання 3: Знаходження мінімальної висоти для всіх можливих поєднань параметрів pres.abs та NoOfSites
min_altitude_df = (
    df.groupBy("`pres.abs`", "NoOfSites")
    .agg(spark_min("altitude").alias("min_altitude"))
    .orderBy("`pres.abs`", "NoOfSites")
)

# Додавання більш зрозумілого опису для pres.abs
min_altitude_df = min_altitude_df.withColumn(
    "presence", when(col("`pres.abs`") == 0, "Присутні").otherwise("Відсутні")
)

# Покращення виводу
print(
    "\n3. Мінімальна висота для всіх можливих поєднань параметрів наявності жаб та кількості місць для розмноження:"
)
min_altitude_df.select("presence", "NoOfSites", "min_altitude").show(truncate=False)

# Завдання 4: Додавання нового стовпця з різницею між максимальною та поточною відстанню
max_distance = df.filter(col("`pres.abs`") == 0).agg(spark_max("distance")).first()[0]

frogs_with_diff_df = df.withColumn(
    "distance_diff",
    when(col("`pres.abs`") == 1, lit(max_distance) - col("distance")).otherwise(lit(0)),
)

print(
    "\n4. Таблиця з новим стовпцем, що містить різницю між максимальною та поточною відстанню:"
)
frogs_with_diff_df.select("`pres.abs`", "distance", "distance_diff").show(50)

# Збереження результату в новий CSV файл
frogs_with_diff_df.write.option("header", "true").csv(
    "./BigData/lab2/frogs_with_diff.csv"
)

print("\nНовий CSV файл 'frogs_with_diff.csv' створено.")

spark.stop()
