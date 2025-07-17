## 9. Object Memory & JVM Storage

### Q: Create a Student class and track how instance, local, and static variables are stored.
**Real-life:** School database distinguishing student-specific vs. school-wide data.

```java
  class Student {
    String name;
    static String school = "ABC";
    void print() {
        String local = "LocalVar";
        System.out.println(name + " " + school + " " + local);
    }
}
```

### Q: Write a Java class to show memory allocation for multiple instances and how static variables behave.
**Real-life:** Inventory system for a warehouse where product category is shared.

```java
  class Product {
    static String category = "Electronics";
    String name;
    Product(String name) {
        this.name = name;
    }
    void show() {
        System.out.println(name + " " + category);
    }
}
```