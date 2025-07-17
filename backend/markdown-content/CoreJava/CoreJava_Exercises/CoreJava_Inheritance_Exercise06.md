## 6. Inheritance

### Q:Create a class Vehicle and derive Car and Bike from it. Implement methods like start() and fuelType().
**Real-life:** Vehicle service center management system.

```java
class Vehicle {
    void start() {
        System.out.println("Vehicle started");
    }

    void fuelType() {
        System.out.println("Generic fuel");
    }
}

class Car extends Vehicle {
    void fuelType() {
        System.out.println("Petrol");
    }
}

class Bike extends Vehicle {
    void fuelType() {
        System.out.println("Diesel");
    }
}
```

### Q: Build an Employee superclass with a login() method. Derive Manager, Developer, and override their behavior.
**Real-life:** Employee login portal with different dashboards.

```java
class Employee {
    void login() {
        System.out.println("Employee login");
    }
}

class Manager extends Employee {
    void login() {
        System.out.println("Manager login");
    }
}

class Developer extends Employee {
    void login() {
        System.out.println("Developer login");
    }
}
```