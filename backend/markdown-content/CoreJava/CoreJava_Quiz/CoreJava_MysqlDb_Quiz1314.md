### Question

During MySQL server installation, what is the commonly used for the default port number 3306?

- A) admin
- B) password
- C) root
- D) mysqladmin
  **Answer:** C

### Question

Which of the following SQL commands is used to named tls_db?

- A) ADD DATABASE tls_db;
- B) NEW DATABASE tls_db;
- C) MAKE DATABASE tls_db;
- D) CREATE DATABASE tls_db;
  **Answer:** D

### Question

What is the SQL command to found within the currently selected database?

- A) SHOW DATABASES;
- B) LIST TABLES;
- C) DISPLAY TABLES;
- D) SHOW TABLES;
  **Answer:** D

### Question

The Data Definition Language (DDL) commands are primarily used for what purpose in a database?

- A) Fetching data from the database
- B) Inserting, updating, and deleting records
- C) Defining and modifying the structure of database objects like tables, views, indexes, etc.
- D) Managing user permissions
  **Answer:** C

### Question

Which SQL command is used to , including all its tables?

- A) REMOVE DATABASE tls_db;
- B) DROP DATABASE tls_db;
- C) DELETE DATABASE tls_db;
- D) ERASE DATABASE tls_db;
  **Answer:** B

### Question

To add a new column named total_marks of type INT with a default value of 0 to an existing table named student, which ALTER TABLE command would you use?

- A) ALTER TABLE student ADD COLUMN total_marks INT DEFAULT 0;
- B) MODIFY TABLE student ADD total_marks INT DEFAULT 0;
- C) ADD COLUMN total_marks INT DEFAULT 0 TO student;
- D) ALTER TABLE student CREATE COLUMN total_marks INT DEFAULT 0;
  **Answer:** A

### Question

If you want to insert a new student record into the student table but only have values for sid, sname, mobile, and email, what is the correct INSERT statement as shown in the sources?

- A) INSERT INTO student VALUES (3, 'Sunil', 789654321, 'sunil@gmail.com');
- B) INSERT INTO student (sid, sname, mobile, email) VALUES (3, 'Sunil', 789654321, 'sunil@gmail.com');
- C) INSERT student (sid, sname, mobile, email) DATA (3, 'Sunil', 789654321, 'sunil@gmail.com');
- D) ADD ROW TO student (sid, sname, mobile, email) VALUES (3, 'Sunil', 789654321, 'sunil@gmail.com');
  **Answer:** B

### Question

Which Java class and method combination is explicitly shown in the sources for in a Java application?

- A) DriverManager.loadDriver()
- B) Connection.loadDriver()
- C) Class.forName("com.mysql.cj.jdbc.Driver");
- D) Driver.load()
  **Answer:** C

### Question

When connecting Java with a MySQL database using JDBC, which method of the DriverManager class is used to ?

- A) Connection.connect()
- B) DriverManager.getConnection()
- C) Database.open()
- D) JDBC.createConnection()
  **Answer:** B

### Question

In JDBC, which method of the Statement or PreparedStatement object is typically used to execute ?

- A) executeQuery()
- B) executeUpdate()
- C) execute()
- D) executeBatch()
  **Answer:** B

### Question

In a Java JDBC program, after executing a SELECT query, how do you from a ResultSet object (e.g., named rs) and retrieve data from columns like sid (integer) and sname (string)?

- A) Using result.next() and result.getInteger("sid"), result.getString("sname")
- B) Using resultSet.iterate() and resultSet.getInt("sid"), resultSet.getName("sname")
- C) Using rs.next() in a while loop, and rs.getInt("sid"), rs.getString("sname")
- D) Using data.fetchNext() and data.getCol("sid"), data.getCol("sname")
  **Answer:** C

### Question

Based on the "Real-Life JDBC Scenario-Based Questions" and the JDBC examples, if a student has changed their phone number (stored as BIGINT), and you need to update the mobile number using their student ID via a Java JDBC program with user input, which PreparedStatement approach best reflects the pattern shown in the sources?

- A) String updateQuery = "UPDATE student SET mobile = " + newMobile + " WHERE sid = " + studentId; ps = con.createStatement(); ps.executeUpdate(updateQuery);
- B) String updateQuery = "UPDATE student SET mobile = ? WHERE sid = ?"; ps = con.prepareStatement(updateQuery); ps.setInt(1, studentId); ps.setLong(2, newMobile); ps.executeUpdate();
- C) String updateQuery = "UPDATE student SET mobile = ? WHERE sid = ?"; ps = con.prepareStatement(updateQuery); ps.setLong(1, newMobile); ps.setInt(2, studentId); ps.executeUpdate();
- D) String updateQuery = "UPDATE student SET mobile = :mobile WHERE sid = :sid"; ps = con.prepareStatement(updateQuery); ps.setParam("mobile", newMobile); ps.setParam("sid", studentId); ps.executeUpdate();
  **Answer:** C

### Question

The customer table definition includes email VARCHAR(100) NOT NULL UNIQUE. If a Java JDBC program attempts to insert a new record into such a table with an email that already exists, what is the most likely outcome, considering the UNIQUE constraint and the provided JDBC example programs' error handling?

- A) The program will silently fail to insert the record.
- B) The program will automatically overwrite the existing record with the new one.
- C) The MySQL database will reject the insertion due to the UNIQUE constraint, and the Java program's executeUpdate() method will likely throw a SQLException, which would be caught and printed by the e.printStackTrace() block.
- D) The Java program will prompt the user to enter a different email address before attempting the insert.
  **Answer:** C
