## 8. Method Overriding & Polymorphism

### Q: Simulate an online payment system where CardPayment and UPIPayment override pay() method of Payment class.
**Real-life:** Unified payment gateway backend.

```java
class Payment {
    void pay() {
        System.out.println("Payment processed");
    }
}

class CardPayment extends Payment {
    void pay() {
        System.out.println("Card Payment done");
    }
}

class UPIPayment extends Payment {
    void pay() {
        System.out.println("UPI Payment done");
    }
}
``` 

### Q: Create a superclass Notification and override notifyUser() in EmailNotification, SMSNotification.
**Real-life:** Notification system in e-commerce.

```java
class Notification {
    void notifyUser() {
        System.out.println("Generic notification");
    }
}

class EmailNotification extends Notification {
    void notifyUser() {
        System.out.println("Email sent");
    }
}

class SMSNotification extends Notification {
    void notifyUser() {
        System.out.println("SMS sent");
    }
}
```