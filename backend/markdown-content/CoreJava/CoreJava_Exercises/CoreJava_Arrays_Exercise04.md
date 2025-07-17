## 4. Arrays

### Q: Accept temperatures for 7 days and calculate the average temperature.
**Real-life:** Weather forecasting application.

```java
  import java.util.Scanner;
public class AverageTemperature {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] temps = new int[7];
        int sum = 0;
        for (int i = 0; i < 7; i++) {
            temps[i] = sc.nextInt();
            sum += temps[i];
        }
        System.out.println("Average: " + (sum / 7.0));
    }
}
```

### Q: Accept scores of 5 students and find the highest scorer.
**Real-life:** Result processing system for a school.

```java
import java.util.Scanner;

public class HighestScore {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] scores = new int[5];
        int max = 0;
        for (int i = 0; i < 5; i++) {
            scores[i] = sc.nextInt();
            if (scores[i] > scores[max]) max = i;
        }
        System.out.println("Highest Score: " + scores[max]);
    }
}
```

### Q: Sort prices of grocery items using Bubble Sort.
**Real-life:** A small retail shop organizing price tags.

```java
  import java.util.Scanner;
public class BubbleSort {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] prices = new int[5];
        for (int i = 0; i < prices.length; i++) {
            prices[i] = sc.nextInt();
        }
        for (int i = 0; i < prices.length - 1; i++) {
            for (int j = 0; j < prices.length - i - 1; j++) {
                if (prices[j] > prices[j + 1]) {
                    int temp = prices[j];
                    prices[j] = prices[j + 1];
                    prices[j + 1] = temp;
                }
            }
        }
        for (int price : prices) {
            System.out.println(price);
        }
    }
}
```