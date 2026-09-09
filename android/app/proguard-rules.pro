# Capacitor llama plugins por reflexión; sin esto R8 puede romper el puente JS.
-keep class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public <init>(...);
    public *;
}
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

-keep class com.wodotobox.app.** { *; }
-keep class ee.forgr.capacitor.social.login.** { *; }

-keepattributes SourceFile,LineNumberTable,InnerClasses,Signature,*Annotation*
-renamesourcefileattribute SourceFile
