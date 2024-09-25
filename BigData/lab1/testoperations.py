from pyspark.sql import SparkSession
from pyspark.sql.functions import col, lit

spark = SparkSession.builder.appName("DataFrameOperations").getOrCreate()

df1 = spark.createDataFrame(
    [(1, "Аліна", 22), (2, "Михайло", 21), (3, "Павло", 25)], ["id", "name", "age"]
)

print("DataFrame 1:")
df1.show()

df2 = spark.createDataFrame(
    [(3, "Валерія", "UA"), (4, "Анстасія", "HR"), (5, "Григорій", "Finance")],
    ["id", "name", "department"],
)

print("DataFrame 2:")
df2.show()

# Об'єднання (Union) DataFrame
df_union = df1.union(df2.select("id", "name", lit(None).alias("age")))
print("Об'єднаний DataFrame:")
df_union.show()

# Додавання стовпця
df_with_new_column = df1.withColumn("salary", lit(1000))
print("DataFrame з новим стовпцем:")
df_with_new_column.show()

# Видалення стовпця
df_without_age = df1.drop("age")
print("DataFrame без стовпця 'age':")
df_without_age.show()

# Фільтрація рядків (видалення за умовою)
df_filtered = df1.filter(col("age") > 23)
print("DataFrame з видаленими рядками (age <= 23):")
df_filtered.show()

# З'єднання (Join) DataFrame
df_joined = df1.join(df2, "id", "inner")
print("З'єднаний DataFrame:")
df_joined.show()

spark.stop()
