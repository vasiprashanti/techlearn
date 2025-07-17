## 7. Constructor & this Keyword

### Q: Create a Book class with a parameterized constructor to store title, author, and price.
**Real-life:** Library management system.

```java
class Book {
    String title, author;
    double price;

    Book(String title, String author, double price) {
        this.title = title;
        this.author = author;
        this.price = price;
    }
}
```

### Q: Use constructor overloading in a Student class to handle admissions with or without optional email.
**Real-life:** College admission system.

```java
class Student {
    String name, email;

    Student(String name) {
        this.name = name;
    }

    Student(String name, String email) {
        this.name = name;
        this.email = email;
    }
}
```