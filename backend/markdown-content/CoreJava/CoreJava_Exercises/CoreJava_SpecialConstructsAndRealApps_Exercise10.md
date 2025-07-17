## 10. Special Constructs & Real Apps

### Q: Implement a Logger class using Singleton pattern with a private constructor.
**Real-life:** Log manager in backend systems.

```java
class Logger {
    private static Logger instance = new Logger();

    private Logger() {}

    public static Logger getInstance() {
        return instance;
    }
}
```

### Q: Simulate a basic hotel booking app using a Room class, booking method, and update using this.
**Real-life:** Online hotel reservation portal logic.

```java
class Room {
    int roomNo;
    boolean booked;

    void bookRoom() {
        this.booked = true;
    }
}

```