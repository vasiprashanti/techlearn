**CORE JAVA NOTES - 13**

**MYSQL DATABASE - SQL QUERIES**

### Steps to Install and Execute SQL Queries in Mysql Database Server

1. **Download and Install Mysql server** using the below given link:

   <https://dev.mysql.com/downloads/installer/>

| **Windows (x86, 32-bit), MSI Installer**     |                 8.0.34                 | 2.4M                                                                                                   | [**Download**](https://dev.mysql.com/downloads/file/?id=520406) |     |
| :------------------------------------------- | :------------------------------------: | :----------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :-: |
| (mysql-installer-web-community-8.0.34.0.msi) | MD5: 01baf7b42e551d53efb557eed401ff91  | [Signature](https://dev.mysql.com/downloads/gpg/?file=mysql-installer-web-community-8.0.34.0.msi&p=25) |                                                                 |     |
| **Windows (x86, 32-bit), MSI Installer**     |                 8.0.34                 | 331.3M                                                                                                 | [**Download**](https://dev.mysql.com/downloads/file/?id=520407) |     |
| (mysql-installer-community-8.0.34.0.msi)     | MD5: 59eaa511c39011a2f0264311a80b0228  | [Signature](https://dev.mysql.com/downloads/gpg/?file=mysql-installer-community-8.0.34.0.msi&p=25)     |                                                                 |     |

Once the mysql server is downloaded successfully, click on the setup file and install it by following the installation steps and give the Password during installation as “root” for the default port number 3306

2. **Steps to interact with database using mysql command Line**

- **Open mysql 8.0 Command Line Client and type root as the password**

```
Enter password: root
```

- **Connect with the default database mysql by typing:**

```
USE DATABASE mysql;
```

Or

- **Create a new database tls_db, by typing:**

```
CREATE DATABASE tls_db;
```

- **To use the newly created db -> tls_db, by typing:**

```
USE tls_db;
```

- **To view the tables list found in the db, type:**

```
SHOW TABLES;
```

---

### DDL – Data Definition Language

DDL commands are used to define and modify the **structure** of database objects like **tables, views, indexes**, etc.

#### CREATE – Create a database or table

```sql
CREATE DATABASE tls_db;

CREATE TABLE customer (
    customer_id INT PRIMARY KEY,
    customer_name VARCHAR(45) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    mobile BIGINT(10) NOT NULL UNIQUE
);

CREATE TABLE customer2 (
    student_id INT PRIMARY KEY,
    student_name VARCHAR(45) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile BIGINT(10) NOT NULL,
    CONSTRAINT eml_unq UNIQUE(email),
    CONSTRAINT mob_unq UNIQUE(mobile)
);
```

**View table structure:**

```sql
DESC student;
DESCRIBE student;
```

#### DROP – Delete database or table permanently

```sql
-- Drop the entire database (including all tables)
DROP DATABASE tls_db;

-- Drop a single table
DROP TABLE student;
```

#### ALTER – Modify table structure

```sql
ALTER TABLE student ADD COLUMN total_marks INT DEFAULT 0;
ALTER TABLE student ADD COLUMN email VARCHAR(100);
ALTER TABLE student ADD CONSTRAINT eml_unq UNIQUE(email);
ALTER TABLE student ADD CONSTRAINT std_unq UNIQUE(mobile, email);
ALTER TABLE student DROP CONSTRAINT eml_unq;
ALTER TABLE student MODIFY COLUMN email VARCHAR(200);
```

---

### DQL – Data Query Language

DQL is used to **fetch data** from the database using the **SELECT** statement.

- View entire table

```sql
SELECT * FROM student;
```

- View a specific row using PRIMARY KEY

```sql
SELECT * FROM student WHERE sid = 1;
```

- View multiple rows based on a condition

```sql
SELECT * FROM student WHERE total_marks >= 400;
```

- View a single column for all rows

```sql
SELECT sname FROM student;
```

- View multiple columns for all rows

```sql
SELECT sname, mobile FROM student;
```

---

### DML – Data Manipulation Language

Used to **Insert**, **Update**, and **Delete** records (rows) in a table.

#### INSERT – Add new rows

```sql
INSERT INTO student VALUES (2, 'Pranav', 987654321, 450, 'pranav@gmail.com');
```

_Insert partial values (specify columns)_

```sql
INSERT INTO student (sid, sname, mobile, email) VALUES (3, 'Sunil', 789654321, 'sunil@gmail.com');
```

_Insert with a NULL value_

```sql
INSERT INTO student VALUES (4, 'Nikhil', 900654321, NULL, 'nikhil12@gmail.com');
```

#### DELETE – Remove rows

_Delete one row using primary key_

```sql
DELETE FROM student WHERE sid = 3;
```

_Delete all rows (table stays)_

```sql
DELETE FROM student;
```

_Delete multiple rows by condition_

```sql
DELETE FROM student WHERE total_marks = 450;
```

#### UPDATE – Modify existing rows

_Update one column of one row_

```sql
UPDATE student SET mobile = 96766663136 WHERE sid = 1;
```

_Update multiple columns of one row_

```sql
UPDATE student SET mobile = 9000663666, total_marks = 400 WHERE sid = 3;
```

_Set default value for NULL entries_

```sql
UPDATE student SET total_marks = 0 WHERE total_marks IS NULL;
```

_Set total_marks = 480 for sid = 4_

```sql
UPDATE student SET total_marks = 480 WHERE sid = 4;
```

---

**CORE JAVA NOTES – 14**

---

### Steps to Connect Java with MySQL Database (JDBC)

To store and manage student information:

#### 1. MySQL Database Setup (Before Java Code)

Connect to MySQL Server:

Use your MySQL command line or GUI tool (like MySQL Workbench):

```sh
mysql -u root -p
```

_Create a database:_

```sql
CREATE DATABASE tls_db;
```

_Use the database:_

```sql
USE tls_db;
```

_Create a table:_

```sql
CREATE TABLE student (
    sid INT,
    sname VARCHAR(45),
    mobile BIGINT,
    email VARCHAR(100)
);
```

_Insert a row:_

```sql
INSERT INTO student VALUES (101, 'Gowri', 9876666890, 'gowri@gmail.com');
```

_Delete a row:_

```sql
DELETE FROM student WHERE sid = 101;
```

_Update a row:_

```sql
UPDATE student SET sname = 'Gowri' WHERE sid = 101;
```

_View all rows:_

```sql
SELECT * FROM student;
```

_View specific columns:_

```sql
SELECT email, mobile FROM student WHERE sname = 'Gowri';
```

---

#### Full Example Program (With INSERT, UPDATE, DELETE, SELECT)

```java
import java.sql.*;

public class StudentDBApp {
    public static void main(String[] args) {
        // Step 1: Load MySQL JDBC Driver
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            // Step 2: Establish Connection
            Connection con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/tls_db", "root", "your_password");
            // Step 3: Create Statement
            Statement stmt = con.createStatement();
            // INSERT Operation
            String insertQuery = "INSERT INTO student VALUES (101, 'Gowri', 9876666890, 'gowri@gmail.com')";
            stmt.executeUpdate(insertQuery);
            System.out.println("Insert Successful");
            // UPDATE Operation
            String updateQuery = "UPDATE student SET sname='Gowri R' WHERE sid=101";
            stmt.executeUpdate(updateQuery);
            System.out.println("Update Successful");
            // DELETE Operation
            String deleteQuery = "DELETE FROM student WHERE sid=101";
            stmt.executeUpdate(deleteQuery);
            System.out.println("Delete Successful");
            // SELECT Operation
            String selectQuery = "SELECT * FROM student";
            ResultSet rs = stmt.executeQuery(selectQuery);
            // Step 4: Process ResultSet
            while (rs.next()) {
                System.out.println(
                    rs.getInt("sid") + ", " +
                    rs.getString("sname") + ", " +
                    rs.getLong("mobile") + ", " +
                    rs.getString("email")
                );
            }
            // Step 5: Close Connection
            rs.close();
            stmt.close();
            con.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

### 2) Db Program to insert a row in student table

```java
import java.sql.*;

public class InsertStudent {
    public static void main(String[] args) {
        try {
            // 1. Load MySQL JDBC driver
            Class.forName("com.mysql.cj.jdbc.Driver");
            // 2. Connect to the database
            Connection con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/tls_db", "root", "your_password");
            // 3. Create a PreparedStatement to insert values
            String insertSQL = "INSERT INTO student (sid, sname, mobile, email) VALUES (?, ?, ?, ?)";
            PreparedStatement ps = con.prepareStatement(insertSQL);
            // 4. Set values (change as needed)
            ps.setInt(1, 102);
            ps.setString(2, "Ravi");
            ps.setLong(3, 9876543210L);
            ps.setString(4, "ravi@example.com");
            // 5. Execute the insert
            int rows = ps.executeUpdate();
            System.out.println(rows + " row(s) inserted.");
            // 6. Close the connection
            ps.close();
            con.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

### 3) Db program to save the user entered data for a student into the student table

```java
import java.sql.*;
import java.util.Scanner;

public class InsertStudentFromUser {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        try {
            // 1. Load JDBC driver
            Class.forName("com.mysql.cj.jdbc.Driver");
            // 2. Establish connection
            Connection con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/tls_db", "root", "your_password");
            // 3. Prepare SQL insert query
            String insertQuery = "INSERT INTO student (sid, sname, mobile, email) VALUES (?, ?, ?, ?)";
            PreparedStatement ps = con.prepareStatement(insertQuery);
            // 4. Take user input
            System.out.print("Enter Student ID: ");
            int sid = sc.nextInt();
            sc.nextLine(); // consume newline
            System.out.print("Enter Student Name: ");
            String sname = sc.nextLine();
            System.out.print("Enter Mobile Number: ");
            long mobile = sc.nextLong();
            sc.nextLine(); // consume newline
            System.out.print("Enter Email: ");
            String email = sc.nextLine();
            // 5. Set values in PreparedStatement
            ps.setInt(1, sid);
            ps.setString(2, sname);
            ps.setLong(3, mobile);
            ps.setString(4, email);
            // 6. Execute the insert
            int rows = ps.executeUpdate();
            System.out.println(rows + " row(s) inserted successfully.");
            // 7. Close connections
            ps.close();
            con.close();
            sc.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

### 4) Update Student Email Based on ID (User Input)

```java
import java.sql.*;
import java.util.Scanner;

public class UpdateStudentEmail {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/tls_db", "root", "your_password");
            String updateQuery = "UPDATE student SET email = ? WHERE sid = ?";
            PreparedStatement ps = con.prepareStatement(updateQuery);
            System.out.print("Enter Student ID to update: ");
            int sid = sc.nextInt();
            sc.nextLine(); // consume newline
            System.out.print("Enter new email: ");
            String email = sc.nextLine();
            ps.setString(1, email);
            ps.setInt(2, sid);
            int rows = ps.executeUpdate();
            if (rows > 0)
                System.out.println("Email updated successfully.");
            else
                System.out.println("No student found with ID: " + sid);
            ps.close();
            con.close();
            sc.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

### 5) Delete a Student Record Using ID (User Input)

```java
import java.sql.*;
import java.util.Scanner;

public class DeleteStudent {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/tls_db", "root", "your_password");
            String deleteQuery = "DELETE FROM student WHERE sid = ?";
            PreparedStatement ps = con.prepareStatement(deleteQuery);
            System.out.print("Enter Student ID to delete: ");
            int sid = sc.nextInt();
            ps.setInt(1, sid);
            int rows = ps.executeUpdate();
            if (rows > 0)
                System.out.println("Student deleted successfully.");
            else
                System.out.println("No student found with ID: " + sid);
            ps.close();
            con.close();
            sc.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

### Real-Life JDBC Scenario-Based Questions

1. **Admission Portal**

   _A college wants to collect new student details including name, mobile number, email, and department. Write a Java JDBC program to insert this data into the student table._

2. **Update Contact**

   _A student has changed their phone number. How would you write a JDBC program to update the mobile number using the student’s ID?_

3. **Student Withdrawal**

   _A student has left the college. Write a program to delete their record from the database using their student ID._

4. **Search Feature**

   _A teacher wants to check details of a student by their name. Write a program to fetch and display student data where sname matches user input._

5. **Filtered Display**

   _Display all students who scored more than 400 marks. How would you implement this using a SELECT query in JDBC?_

6. **Department-Wise Count**

   _You are maintaining students by department. How would you write a program to count how many students are registered in the “CSE” department?_

7. **Bulk Registration**

   _Write a loop-based program that takes data for multiple students (using Scanner) and stores them in the database one by one._

8. **Email Validation**

   _You want to prevent duplicate emails from being inserted into the student table. How will you handle this in your JDBC code?_

9. **Import from CSV**

   _How would you write a Java program to read a CSV file of student records and insert them into the student table?_

10. **Transaction Handling**

_A program is inserting student data into two related tables (student and login). If one fails, both should roll back. How will you use JDBC transactions to handle this?_
