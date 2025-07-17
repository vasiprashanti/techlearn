## 1. Basics & Data Types

### Q: Create a Java program that stores and displays personal details like name, age, and mobile number using appropriate data types.
**Real-life:** Student ID form entry at college.

```java
public class PersonalDetails {
    public static void main(String[] args) {
        String name = "John Doe";
        int age = 20;
        long mobile = 9876543210L;
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Mobile: " + mobile);
    }
}
```

### Q: Write a Java program to calculate and display the square of a number entered by the user.
**Real-life:** A calculator app for school students.

```java
import java.util.Scanner;

public class SquareCalculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int num = sc.nextInt();
        System.out.println("Square: " + (num * num));
    }
}
```