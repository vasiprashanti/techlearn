CORE JAVA NOTES -03,04

Control Statements

**Understanding Control Flow Statements in Java**

In a typical Java program, execution begins at the first line and proceeds step-by-step down the code, following a linear path. However, real-world programming demands flexibility — the ability to make decisions, repeat certain actions, and jump to specific points in the program depending on specific conditions. This is where **control flow statements** become essential. These constructs allow programmers to **manage the logical flow of a program**, enabling more intelligent, responsive, and efficient software.

Java provides **three main categories of control flow statements**: decision-making statements, loop statements, and jump statements. Each of these plays a critical role in directing the program’s behavior beyond simple sequential execution.

**1. Decision-Making Statements**

Java provides several control structures to guide program flow based on conditions:

- **if Statement**: Executes a block only if a condition is true.
- **if…else Statement**: Executes one block if the condition is true, another if false.
- **if…else-if Ladder**: Evaluates multiple conditions in order; runs the first true block or a default else block if none match.
- **Nested if…else**: Allows conditional checks within other conditional blocks for complex decision-making.
- **switch Statement**: Efficiently handles multiple constant values for a single variable; uses case labels and an optional default block.

**2. Loop Statements**

Loops repeat a block of code while a condition is true. Java offers:

- **do-while**: Executes the block at least once; condition is checked after execution.
- **while**: Checks the condition before execution; may skip the loop if false initially.
- **for**: Compact loop with initialization, condition, and update; ideal when iteration count is known.
- **for-each**: Simplifies array/collection traversal; no indexing needed, improves readability.

**3. Jump Statements**

Used to control flow within loops or switch statements:

- **break**: Exits the current loop or switch block immediately; useful to stop execution once a condition is met.
- **continue**: Skips the current loop iteration and proceeds to the next; useful to ignore specific cases without stopping the loop.

**Decision-Making Statements in Java**

Decision-making is a fundamental concept in programming. It allows a program to **make choices** and **execute different blocks of code** based on whether certain conditions are met. In Java, this is accomplished using several types of decision-making statements: if, if-else, if-else-if ladder, nested if-else, and switch.

Let’s explore each one in **depth** with **syntax** and **simple examples**.

**a) if Statement (Without else)**

**Purpose:** Executes a block of code only **if the condition is true**. If the condition is false, it simply skips the block.

**Syntax:**

**If (condition) {**

**}**

**Example:**

**Int age=20;**

**If(age>20){**

**System.out.println(“ can vote”);**

**}**

**b) if-else Statement**

**Purpose:** Provides **two paths**: one block runs if the condition is true, and the other runs if the condition is false.

**Syntax:**

**If (condition) {**

**}else{**

**}**

**Example:**

int marks = 40;

if (marks >= 50) {

System.out println ("You passed.");

｝ else｛

System.out.println("You failed.");

}

**c) if…else-if…else Ladder**

**Syntax:**

if (condition1) {

} else if (condition2) {

} else if (condition3) {

} else {

}

**Example:**

int score = 85;

if (score >= 90) {

System.out.println("Grade A");

} else if (score >= 80) {

System.out.println ("Grade B");

} else if (score >= 70) {

System.out.println ("Grade C");

} else {

System.out.println("Fail");

}

**d) Nested if-else Statement**

**Syntax:**

```java
if (condition1) {
    if (condition2) {
        // Code block for condition2
    } else {
        // Code block for else of condition2
    }
} else {
    // Code block for else of condition1
}
```

**Example:**

```java
int num = 10;

if (num >= 0) {
    if (num % 2 == 0) {
        System.out.println("Positive and Even");
    } else {
        System.out.println("Positive and Odd");
    }
} else {
    System.out.println("Negative number");
}
```

---

**Switch Statement**

**Purpose:** Used as a **cleaner alternative** to long if-else-if ladders when comparing a single variable to many constant values.

**Syntax:**

```java
switch (expression) {
    case value1:
        // Code block for value1
        break;
    case value2:
        // Code block for value2
        break;
    default:
        // Code block for default case
}
```

**Example:**

```java
int day = 3;

switch (day) {
    case 1:
        System.out.println("Monday");
        break;
    case 2:
        System.out.println("Tuesday");
        break;
    case 3:
        System.out.println("Wednesday");
        break;
    default:
        System.out.println("Invalid day");
}
```

---

**Key Differences Between if-else and switch**

| **Feature**          | **if-else**                         | **switch**                               |
| :------------------- | :---------------------------------- | :--------------------------------------- |
| Type of condition    | Boolean expressions (any logic)     | Only equality checks (==) with constants |
| Data types supported | Any type                            | Only int, char, String (Java 7+)         |
| Best for             | Complex logic                       | Simple value comparisons                 |
| Performance          | Slightly slower for many conditions | Faster with many constant cases          |

**Example Username and Password Authentication**

import java.util. Scanner;

public class LoginCheck {

public static void main(String[l args) {

Scanner sc = new Scanner (System.in);

String existingUsername = "techlearn";

String existingPassword = "tls@2014";

System.out.print("Enter username: ");

String username = sc.nextLine();

System.out.print("Enter password: ");

String password = sc. nextLine();

if (username.isEmpty() || password.isEmpty()) {

System.out.println("Enter the username/password.");

} else if (username. equals(existingUsername) && password.equals(existingPassword))

System.out.println("Hello! Techlearn");

} else {

System.out.println("Invalid Username/Password") ;

**Q. More question to practice and real life example**

- Password Change Program
- Banking Account Debit Program
- Password Strength Validation
- Check if a number is Positive, Negative, or Zero
- Find the Largest of 3 Numbers
- Simple Switch Example – Days of the Week

**Understanding Loop Statements in Java:**

Repetition is essential in programming for tasks like processing lists or running code based on conditions. Java provides powerful looping constructs to handle such tasks efficiently. This overview explains the structure, types, and practical uses of Java loops.

**What is a Loop?**

A loop is a control structure that repeatedly executes code as long as a condition is true. It involves four main steps:

1. **Initialization** – Set starting value.
1. **Condition Check** – Decide whether to continue.
1. **Loop Body** – Code to execute repeatedly.
1. **Update** – Modify counter or state

The loop runs until the condition becomes false.

**Types of Loops in Java**

Java supports four main types of loops:

**1. Do-While Loop:** The do-while loop is an _exit-controlled_ loop, meaning the loop body executes first before the condition is checked.

**Syntax:**

do {

`    `// loop body

} while (condition);

**2. While Loop:** The while loop is an _entry-controlled_ loop, meaning the condition is checked **before** the execution of the loop body.

**Syntax:**

while (condition) {

}

**3. For Loop** :The for loop is a compact form of the while loop, typically used when the number of iterations is known.

**Syntax:**

**for (initialization; condition; update) {**

`    `**}**

**4. For-Each Loop:** The for-each loop (enhanced for loop) is designed to iterate over **arrays or collections** in a clean and readable way.

**Syntax:**

for (type variable : collection) {

}

**Loop Control Statements**

Java also provides mechanisms to control loop execution more precisely:

- **break**: Immediately terminates the loop when a certain condition is met.
- **continue**: Skips the current iteration and moves to the next iteration of the loop.

**Nested Loops and Pattern Printing**

- Loops can also be nested — placing one loop inside another. This is especially useful for working with multi-dimensional data or creating output in matrix or pattern format.

**Example – Printing a Number Triangle:**

for (int i = 1; i <= 4; i++) {

for (int j = 1; j < i; j++) {

System.out.print(j + " ");

｝

Sstem.out.println();

**Jump Statements in Java**

Jump statements are used to **alter the normal flow of control** in loops or switch-case structures. In Java, the most common jump statements are:

1. break
1. continue

**Comparison of break and continue**

| **Feature**     | **break**                             | **continue**                          |
| :-------------- | :------------------------------------ | :------------------------------------ |
| What it does    | Exits the loop completely             | Skips current iteration and continues |
| Used in         | Loops and switch-case statements      | Loops only                            |
| Effect          | Control jumps outside the loop        | Control jumps to the next iteration   |
| Common use case | Terminate early when condition is met | Skip processing certain values        |

**\*Q. 10 practice questions** focused specifically on **jump statements:\***

**Beginner-Level Questions**

1. **Break on specific number:**
   1. Write a program that prints numbers from 1 to 10, but **stops** printing when it reaches 6 using break.
1. **Skip a number:**
   1. Print numbers from 1 to 10 but **skip** printing the number 7 using continue.
1. **Break on user input:**
   1. Continuously accept numbers from the user and **stop** (break the loop) when the user enters -1.
1. **Skip even numbers:**
   1. Print all **odd numbers** between 1 and 20 using a loop and continue to skip even ones.
1. **Break on first multiple of 9:**
   1. Write a loop from 1 to 100, and **break** the loop when the first multiple of 9 is found. Print that number.

**Intermediate-Level Questions**

6. **Count until a condition with break:**
   1. Accept marks from students one by one and stop when a student scores **zero**. Count how many students entered marks before zero.
7. **Sum skipping negatives:**
   1. Take 10 numbers from the user and find the **sum of only the positive ones**, skipping the negatives using continue.
8. **Print first N even numbers but stop early:**
   1. Print the first 20 even numbers, but if the sum exceeds 100, break the loop.

**Advanced-Level Questions**

9. **Break on repeated input:**
   1. Continuously accept words from the user and **stop** when the same word is entered twice in a row.
10. **Skip multiples of 3 or 5:**

- numbers from 1 to 50, but skip all numbers that are **multiples of 3 or 5** using continue.

_Q. Here are **10 practice questions** (in words only) to help you master **nested loops** in Java_

**Basic Level**

1. **Multiplication Tables:**

   Write a program to print the multiplication tables from 1 to 10.

1. **All Combinations of Two Dice Rolls:**

   Display all possible outcomes when two six-sided dice are rolled.

1. **Pairs of Numbers Whose Sum is Even (1 to 10):**

   Display all pairs of numbers between 1 and 10 where the sum of the pair is an even number.

**Intermediate Level**

4. **Count How Many Times a Digit Appears:**

   Given a number n, count how many times each digit (0–9) appears in all numbers from 1 to n.

5. **Print Prime Numbers Between 1 to 100 (Using Nested Loop):**

   Use a nested loop to check and print all prime numbers from 1 to 100.

6. **Find All Unique Triplets from 1 to 30 That Add to a Given Sum:**

   Accept a number from the user and display all unique combinations of three numbers between 1 and 30 that add up to that number.

7. **Find All Palindromic Numbers Between 10 and 999:**

   Identify and display all numbers between 10 and 999 that are palindromes using nested loops.

**Advanced Level**

8. **Check for Armstrong Numbers Between 100 and 999:**

   Use nested loops to find and display all Armstrong numbers between 100 and 999.

9. **Simulate a Clock:**

   Simulate a 24-hour digital clock (00:00 to 23:59) using nested loops.

10. **Print Pythagorean Triplets (a² + b² = c²) Where a, b, c ≤ 100:**

    Find and display all sets of integers (a, b, c) less than or equal to 100 that satisfy the Pythagorean theorem.
