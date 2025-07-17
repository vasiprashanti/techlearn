## 5. Control Flow & Loops

### Q: Write a program to simulate a bank ATM where users can check balance, deposit, and withdraw money (using switch-case).
**Real-life:** ATM machine interface logic.

```java
import java.util.Scanner;

public class BankATM {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int balance = 1000;

        System.out.println("1. Check Balance\n2. Deposit\n3. Withdraw");
        int choice = sc.nextInt();

        switch (choice) {
            case 1:
                System.out.println("Balance: " + balance);
                break;
            case 2:
                System.out.print("Enter deposit amount: ");
                int dep = sc.nextInt();
                balance += dep;
                System.out.println("New Balance: " + balance);
                break;
            case 3:
                System.out.print("Enter withdrawal amount: ");
                int wd = sc.nextInt();
                if (wd <= balance) {
                    balance -= wd;
                    System.out.println("New Balance: " + balance);
                } else {
                    System.out.println("Insufficient Balance");
                }
                break;
            default:
                System.out.println("Invalid Choice");
        }
    }
}
```

### Q: Accept student marks and categorize grades using if-else-if ladder.
**Real-life:** Online exam results portal.

```java
import java.util.Scanner;

public class GradeCategorizer {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter marks: ");
        int marks = sc.nextInt();

        if (marks >= 90)
            System.out.println("Grade A");
        else if (marks >= 75)
            System.out.println("Grade B");
        else if (marks >= 60)
            System.out.println("Grade C");
        else
            System.out.println("Grade D");
    }
}
```