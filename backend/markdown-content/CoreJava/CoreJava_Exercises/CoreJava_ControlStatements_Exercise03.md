## 3. Control Statements

### Q: Create a voting eligibility checker based on age.
**Real-life:** Government app for voter registration.

```java
import java.util.Scanner;

public class VotingEligibility {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter your age: ");
        int age = sc.nextInt();

        if (age >= 18)
            System.out.println("Eligible to vote");
        else
            System.out.println("Not eligible");
    }
}
```

### Q: Print all even numbers from 1 to 100 using a loop.
**Real-life:** Display even-numbered seats in a cinema.

```java
public class EvenNumbers {
    public static void main(String[] args) {
        for (int i = 2; i <= 100; i += 2) {
            System.out.println(i);
        }
    }
}
```
