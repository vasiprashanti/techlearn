## 2. Scanner & Input

### Q: Build a menu-driven calculator using Scanner for input. Let the user choose between +, –, \*, /.
**Real-life:** Grocery bill calculator at a local shop.

```java
import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        char op = sc.next().charAt(0);

        if (op == '+') System.out.println(a + b);
        else if (op == '-') System.out.println(a - b);
        else if (op == '*') System.out.println(a * b);
        else if (op == '/') System.out.println(a / b);
        else System.out.println("Invalid operator");
    }
}

``` 

### Q: Accept full name and age from the user and display a welcome message.
**Real-life:** Hotel check-in kiosk collecting guest info.
  
```java  
import java.util.Scanner;

public class WelcomeUser {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String fullName = sc.nextLine();
        int age = sc.nextInt();
        System.out.println("Welcome " + fullName + ", Age: " + age);
    }
}
```