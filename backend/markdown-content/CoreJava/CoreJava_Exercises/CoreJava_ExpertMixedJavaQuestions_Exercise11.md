## EXPERT-MIXED JAVA QUESTIONS

### Q: Event Booking System – Polymorphism + Constructor: Design a system where a class Event is the base for WeddingEvent, CorporateEvent, and BirthdayEvent. Each subclass should override the method calculateCost() based on their custom logic. Use a constructor to initialize event details like name, location, guests.
**Real-life:** Event management company backend.

```java
class Event {
    String name, location;
    int guests;

    Event(String name, String location, int guests) {
        this.name = name;
        this.location = location;
        this.guests = guests;
    }

    int calculateCost() {
        return 0;
    }
}

class WeddingEvent extends Event {
    WeddingEvent(String n, String l, int g) {
        super(n, l, g);
    }

    int calculateCost() {
        return guests * 1000;
    }
}

class CorporateEvent extends Event {
    CorporateEvent(String n, String l, int g) {
        super(n, l, g);
    }

    int calculateCost() {
        return guests * 700;
    }
}

class BirthdayEvent extends Event {
    BirthdayEvent(String n, String l, int g) {
        super(n, l, g);
    }

    int calculateCost() {
        return guests * 500;
    }
}
```

### Q: Restaurant Order – Scanner + if-else + Array: Create a program where a user can order from a fixed menu using Scanner. Store prices in an array. Based on item selected, calculate and display total bill. Include “Apply discount if bill > 1000”.
**Real-life:** Zomato/Swiggy clone mini-project.

```java
import java.util.Scanner;

public class RestaurantOrder {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] items = {"Pizza", "Burger", "Pasta"};
        int[] prices = {500, 300, 400};

        System.out.println("Choose item (0: Pizza, 1: Burger, 2: Pasta):");
        int choice = sc.nextInt();

        int total = prices[choice];
        if (total > 1000) total *= 0.9;

        System.out.println("Total Bill: " + total);
    }
}
```

### Q:Online Exam System – Inheritance + Overriding + Static: Create a base class User with common login logic. Extend it as Admin and Student, each overriding login() and accessDashboard(). Use a static counter to track total logins.
**Real-life:** LMS (Learning Management System) architecture.

```java
class User {
    static int logins = 0;

    void login() {
        logins++;
    }
}

class Admin extends User {
    void login() {
        super.login();
        System.out.println("Admin dashboard");
    }
}

class Student extends User {
    void login() {
        super.login();
        System.out.println("Student dashboard");
    }
}
```

### Q: Fitness Tracker – Constructor Overloading + Arrays: Design a WorkoutSession class with overloaded constructors: One that takes name and duration and another that also includes caloriesBurned[] (per day). Write a method to compute total calories from the array.
**Real-life:** Daily fitness log builder for an app.

```java
class WorkoutSession {
    String name;
    int duration;
    int[] caloriesBurned;

    WorkoutSession(String n, int d) {
        name = n;
        duration = d;
    }

    WorkoutSession(String n, int d, int[] c) {
        name = n;
        duration = d;
        caloriesBurned = c;
    }

    int totalCalories() {
        int sum = 0;
        for (int c : caloriesBurned) {
            sum += c;
        }
        return sum;
    }
}
```

### Q: Smart Shopping Cart – Array + For Loop + continue: Store item prices in an array. Iterate through them, skipping items with price 0 using continue. Calculate total of valid items.
**Real-life:** E-commerce cart with missing/invalid items ignored.

```java
public class ShoppingCart {
    public static void main(String[] args) {
        int[] prices = {100, 0, 200, 300, 0};
        int total = 0;

        for (int price : prices) {
            if (price == 0) continue;
            total += price;
        }

        System.out.println("Total: " + total);
    }
}
```

### Q: Cab Booking App – Method Overriding + super(): A class Cab has a method fare(int km) returning base fare. LuxuryCab overrides it to add luxury tax. Use super.fare(km) in the child class to reuse base logic.
**Real-life:** Uber/Ola backend logic.

```java
class Cab {
    int fare(int km) {
        return km * 10;
    }
}

class LuxuryCab extends Cab {
    int fare(int km) {
        return super.fare(km) + 100;
    }
}
```

### Q: College Admission – Static vs Instance: Create a class CollegeApplicant with static variable collegeName and instance variables name, branch. Show how college name is common while student details differ.
**Real-life:** Demonstrate memory and scope understanding.

```java
class CollegeApplicant {
    static String collegeName = "XYZ College";
    String name, branch;

    CollegeApplicant(String name, String branch) {
        this.name = name;
        this.branch = branch;
    }
}
```

### Q: Bank Loan System – if-else-if + Nested Conditions: Accept income and credit score from user. Use nested if-else-if to decide whether: Loan Approved or Approved with conditions or Rejected.
**Real-life:** Loan approval automation logic.

```java
import java.util.Scanner;

public class LoanApproval {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int income = sc.nextInt();
        int score = sc.nextInt();

        if (income > 50000) {
            if (score > 700)
                System.out.println("Loan Approved");
            else
                System.out.println("Approved with Conditions");
        } else {
            System.out.println("Rejected");
        }
    }
}
```