# CORE JAVA NOTES - 05

## ARRAYS

In Java, an **array** is a powerful data structure that allows developers to store multiple values of the same data type under a single variable name. Arrays are particularly useful when working with large volumes of data where the same kind of processing is applied to each element, such as storing grades, temperatures, or IDs.

### Definition and Characteristics

An array is a fixed-size collection of elements of the same type (primitive or object), stored in contiguous memory. Once declared, its size cannot change.

### Understanding Arrays in Java with Real-Life Examples

Arrays simplify managing multiple related values—like storing grocery items, weekly temperatures, or game scores—avoiding the need for multiple variables.

Let’s explore how arrays work in Java by breaking down key concepts and aligning them with **real-world scenarios**.

---

## 1) Array Initialization in Java

Arrays can be initialized in two ways:

- **a. Static Initialization**
  - Values are assigned at the time of declaration.
  ```java
  int[] nums = {10, 20, 30};
  ```
- **b. Dynamic Initialization**
  - Size is defined first; values are assigned later.
  ```java
  int[] nums = new int[3];
  nums[0] = 10;
  nums[1] = 20;
  nums[2] = 30;
  ```

## 2) Declaration Without Size in the Variable Section

```java
int ar[] = new int[size];
```

## 3) Placement of Brackets

Both declarations are valid:

```java
int[] nums;
int nums[];
```

## 4) Arrays Are Index-Based (Starting from 0)

Every array element is stored with an index, beginning from **0**.

```java
int[] nums = {10, 20, 30};
System.out.println(nums[1]); // Outputs 20
```

## 5) Using .length Attribute

Java arrays come with a built-in property called `.length` that tells you the number of elements in the array.

```java
System.out.println(ar.length);
```

## 6) Accessing Individual Elements

```java
int[] scores = {90, 80, 70};
System.out.println(scores[0]); // Outputs 90
```

### To print the first element of the array:

```java
System.out.println(ar[0]);
```

### To print the last element of the array:

```java
System.out.println(ar[ar.length-1]);
```

### To print all the elements of the array in forward direction:

```java
for(int i = 0; i < ar.length; i++) {
    System.out.println(ar[i]);
}
```

### To print the elements of the array in backward direction (last to first):

```java
for(int i = ar.length - 1; i >= 0; i--) {
    System.out.println(ar[i]);
}
```

### To find the sum of all the elements of the array:

```java
int sum = 0;
for(int i = 0; i < ar.length; i++) {
    sum += ar[i];
}
System.out.println("Sum of array elements is: " + sum);
```

### Find the max and min of an array

```java
int max, min;
max = min = ar[0];
for(int i = 1; i < ar.length; i++) {
    if(ar[i] > max) max = ar[i];
    if(ar[i] < min) min = ar[i];
}
System.out.println("Max: " + max + ", Min: " + min);
```

---

## What is Bubble Sort?

Bubble Sort is a simple sorting algorithm that repeatedly compares and swaps adjacent elements if they’re in the wrong order. With each pass, larger elements “bubble” to the end.

### Bubble Sort Code in Java

```java
public class BubbleSort {
    public static void main(String[] args) {
        int[] arr = {64, 25, 12, 22, 11};
        for (int i = 0; i < arr.length - 1; i++) {
            for (int j = 0; j < arr.length - 1 - i; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        for (int num : arr) {
            System.out.print(num + " ");
        }
    }
}
```

---

## What is Linear Search?

**Linear Search** (also known as Sequential Search) is a simple searching algorithm that checks each element in a list one by one until the target element is found or the list ends.

```java
public class LinearSearch {
    public static void main(String[] args) {
        int[] arr = {10, 25, 30, 45, 50};
        int target = 30;
        boolean found = false;
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                System.out.println("Element found at index: " + i);
                found = true;
                break;
            }
        }
        if (!found) {
            System.out.println("Element not found.");
        }
    }
}
```

---

## Enhanced and Real-Life Inspired Programming Questions

1. **Find the second highest scorer in a list of exam scores.**
   - _Scenario:_ You’re developing a leaderboard feature in an online quiz app to display the top two scorers.
2. **Convert an integer into its 32-bit binary format and store it in an array.**
   - _Scenario:_ You’re building a low-level debugging tool that shows how numbers are stored in memory.
3. **Sort an array of prices using Selection Sort.**
   - _Scenario:_ A store app wants to list prices from lowest to highest using a basic selection sort algorithm.
4. Simulate a countdown timer using arrays (e.g., 10 to 0)
5. Search for a customer ID using linear search in a database array.
6. Rotate the elements of an array to simulate a queue system (e.g., in a hospital or amusement park).
7. Find the average temperature of a week using an array.
8. Count how many students passed or failed using an array of marks.
