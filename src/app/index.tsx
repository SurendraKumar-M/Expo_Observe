import { LinearGradient } from "expo-linear-gradient";
import { Observe, useObserve } from "expo-observe";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import {
  BarChart,
  BubbleChart,
  LineChart,
  PieChart,
  PopulationPyramid,
  RadarChart,
} from "react-native-gifted-charts";



type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  discountPercentage: number;
};

type ProductsResponse = {
  products: Product[];
};

const COLORS = [
  "#6366F1",
  "#F97316",
  "#10B981",
  "#EC4899",
  "#0EA5E9",
  "#A855F7",
];

const shortenLabel = (value: string, maxLength = 10) =>
  value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1)}…`;

const average = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

export default function Index() {
  const { markInteractive } = useObserve();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 150;

  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // useEffect(() => {
  //   makeInteractive();
  // }, [makeInteractive]);

  // 1. Fetch products from DummyJSON.
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "https://dummyjson.com/products"
        );
console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error(
            `Request failed: ${response.status}`
          );
        }

        const result: ProductsResponse = await response.json();

        setData(
          Array.isArray(result.products) ? result.products : []
        );
      } catch (err) {
        Observe.reportError(err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, []);

  useEffect(() => {
    if (!loading) {
      markInteractive();
    }
  }, [loading, markInteractive]);

  // Use a limited number of products for readable chart labels.
  const chartProducts = data;

  // 2. Bar chart: product price.
  const priceChartData = chartProducts.map((product, index) => ({
    value: product.price,
    label: (product.title),
    // frontColor: COLORS[index % COLORS.length],
  }));

  const horizontalPriceChartData = [...chartProducts]
    .sort((a, b) => b.price - a.price)
    .slice(0, 8)
    .map((product) => ({
      value: product.price,
      label: shortenLabel(product.title, 14),
    }));

  // 3. Line/area chart: product rating.
  const ratingChartData = chartProducts.map((product) => ({
    value: product.rating,
    label: shortenLabel(product.title),
  }));

  // 4. Group products by category for pie/donut charts.
  const categoryCounts = data.reduce<Record<string, number>>(
    (result, product) => {
      const category = product.category || "uncategorized";

      result[category] = (result[category] ?? 0) + 1;

      return result;
    },
    {}
  );

  const sortedCategories = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // Show the five most common categories and group the rest.
  const topCategories = sortedCategories.slice(0, 5);

  const otherCategoryCount = sortedCategories
    .slice(5)
    .reduce((sum, [, count]) => sum + count, 0);

  const pieChartData = [
    ...topCategories.map(([category, count], index) => ({
      value: count,
      text: category,
      color: COLORS[index % COLORS.length],
    })),
    ...(otherCategoryCount > 0
      ? [
        {
          value: otherCategoryCount,
          text: "Other",
          color: COLORS[5],
        },
      ]
      : []),
  ];

  // 5. Population pyramid: low-stock vs normal-stock
  // products in each of the top five categories.
  const populationChartData = topCategories.map(([category]) => ({
    yAxisLabel: category,

    left: data.filter(
      (product) =>
        product.category === category && product.stock <= 10
    ).length,

    right: data.filter(
      (product) =>
        product.category === category && product.stock > 10
    ).length,
  }));

  // 6. Radar chart: normalized summary of the product dataset.
  // The four dimensions are scaled to a 0–100 range.
  const maxStock = Math.max(
    1,
    ...data.map((product) => product.stock)
  );

  const maxPrice = Math.max(
    1,
    ...data.map((product) => product.price)
  );

  const radarChartData = [
    (average(data.map((product) => product.rating)) / 5) * 100,

    average(
      data.map((product) => product.discountPercentage)
    ),

    (average(data.map((product) => product.stock)) /
      maxStock) *
    100,

    (average(data.map((product) => product.price)) /
      maxPrice) *
    100,
  ];

  // 7. Bubble/scatter chart:
  // X = price, Y = rating, bubble radius = discount percentage.
  const bubbleChartData = chartProducts.map((product) => ({
    x: product.price,
    y: product.rating,

    // Keep the radius within a reasonable visual range.
    r: Math.max(
      8,
      Math.min(20, product.discountPercentage)
    ),

    label: shortenLabel(product.title, 12),
  }));

  return (
    <LinearGradient
      colors={["#F69191", "#CD944E"]}
      style={styles.container}
    >
      <Button title="Explore" onPress={() => router.push("/explore")} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0000FF" />
          <Text style={styles.statusText}>
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Text>No products found.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.screenTitle}>
            Product Analytics
          </Text>

          <Text style={styles.subtitle}>
            Analysing {data.length} products from DummyJSON
          </Text>

          {/* BAR CHART: Price by product */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Product Prices
            </Text>

            <Text style={styles.description}>
              Price of each product.
            </Text>

            <BarChart
              data={priceChartData}
              adjustToWidth
              height={250}
              barWidth={25}
              spacing={50}
              isAnimated
              stepValue={20}
              yAxisLabelPrefix="$"
              showGradient
              gradientColor="#02ff85"
              frontColor="#9a97d6"

            />
          </View>

          {/* HORIZONTAL BAR CHART */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Top Product Prices — Horizontal
            </Text>

            <Text style={styles.description}>
              Eight highest-priced products.
            </Text>

            <BarChart
              data={horizontalPriceChartData}
              width={screenWidth - 60}
              height={horizontalPriceChartData.length * 40}
              barWidth={15}
              spacing={25}
              horizontal
              isAnimated
              yAxisLabelPrefix="$"
              showGradient
              gradientColor="#02ff85"
              frontColor="#9a97d6"
            />
          </View>

          {/* LINE CHART: Rating by product */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Product Ratings
            </Text>

            <Text style={styles.description}>
              Ratings for the first eight products.
            </Text>

            <LineChart
              data={ratingChartData}
              width={chartWidth}
              height={220}
              maxValue={5}
              noOfSections={5}
              stepValue={1}
              yAxisLabelSuffix="★"
              color="#4F46E5"
              dataPointsColor="#4F46E5"
              dataPointsRadius={4}
              isAnimated
            />
          </View>

          {/* AREA CHART: Same rating data, different presentation */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Product Ratings — Area Chart
            </Text>

            <LineChart
              data={ratingChartData}
              width={chartWidth}
              height={220}
              maxValue={5}
              noOfSections={5}
              stepValue={1}
              yAxisLabelSuffix="★"
              color="#059669"
              areaChart
              startFillColor="#34D399"
              endFillColor="#FFFFFF"
              startOpacity={0.5}
              endOpacity={0.05}
              isAnimated
            />
          </View>

          {/* PIE CHART: Number of products per category */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Products by Category
            </Text>

            <PieChart
              data={pieChartData}
              radius={100}
              showText
              textSize={10}
              textColor="#FFFFFF"
            />
          </View>

          {/* DONUT CHART */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Products by Category — Donut
            </Text>

            <PieChart
              data={pieChartData}
              radius={100}
              donut
              innerRadius={55}
              innerCircleColor="#FFFFFF"
              showText
              textSize={10}
              textColor="#FFFFFF"
            />
          </View>

          {/* POPULATION PYRAMID: Stock-status comparison */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Inventory by Category
            </Text>

            <Text style={styles.description}>
              Left: low stock (10 or fewer).
              Right: normal stock (more than 10).
            </Text>

            <PopulationPyramid
              data={populationChartData}
              width={chartWidth}
              barsMapToYAxisSections
              showValuesAsBarLabels
              showMidAxis
              leftBarColor="#F97316"
              rightBarColor="#10B981"
              noOfSections={4}
            />
          </View>

          {/* RADAR CHART: Normalized dataset summary */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Overall Product Metrics
            </Text>

            <Text style={styles.description}>
              Average rating, discount, stock, and price.
              Metrics are normalized to 0–100.
            </Text>

            <RadarChart
              data={radarChartData}
              labels={[
                "Rating",
                "Discount",
                "Stock",
                "Price",
              ]}
              maxValue={100}
              noOfSections={4}
              chartSize={Math.min(chartWidth - 10, 280)}
            />
          </View>

          {/* BUBBLE CHART */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Price vs Rating
            </Text>

            <Text style={styles.description}>
              X = price, Y = rating, bubble size = discount.
            </Text>

            <BubbleChart
              data={bubbleChartData}
              width={chartWidth}
              height={240}
              minRadius={8}
              maxRadius={20}
            />
          </View>

          {/* SCATTER CHART */}
          <View style={styles.card}>
            <Text style={styles.chartTitle}>
              Price vs Rating — Scatter
            </Text>

            <BubbleChart
              data={bubbleChartData}
              width={chartWidth}
              height={240}
              scatterChart
              minRadius={5}
              maxRadius={10}
            />
          </View>

          {/* ORIGINAL PRODUCT LIST */}
          <Text style={styles.sectionTitle}>
            Product List
          </Text>

          {data.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Text style={styles.productTitle}>
                {product.title}
              </Text>

              <Text style={styles.productDescription}>
                {product.description}
              </Text>

              <Text style={styles.productMeta}>
                Price: ${product.price.toFixed(2)} {" · "}
                Rating: {product.rating} {" · "}
                Stock: {product.stock}
              </Text>

              <Text style={styles.productMeta}>
                Category: {product.category}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  statusText: {
    marginTop: 12,
    fontSize: 16,
  },

  errorText: {
    color: "#B91C1C",
    fontSize: 16,
    textAlign: "center",
  },

  scrollView: {
    flex: 1,
    width: "100%",
  },

  content: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
  },

  screenTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
  },

  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 6,
    marginBottom: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    alignItems: "center",
    overflow: "hidden",
  },

  chartTitle: {
    width: "100%",
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },

  description: {
    width: "100%",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },

  sectionTitle: {
    alignSelf: "flex-start",
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginVertical: 12,
  },

  productCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },

  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4B5563",
    marginBottom: 10,
  },

  productMeta: {
    fontSize: 13,
    color: "#374151",
    marginTop: 4,
  },
});