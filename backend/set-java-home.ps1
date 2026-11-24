# Run this once per PowerShell session before using mvnw.cmd, if you don't
# already have a JDK 21+ on your PATH as `java`/`JAVA_HOME`.
#
# This project needs Java 21. A portable Eclipse Temurin 21 JDK was downloaded
# (no admin rights required) to:
#   C:\Users\zeelp\tools\jdk-21.0.13+9
#
# Usage:  . .\set-java-home.ps1      (note the leading dot-space to dot-source it)
$env:JAVA_HOME = "C:\Users\zeelp\tools\jdk-21.0.13+9"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
Write-Host "JAVA_HOME set to $env:JAVA_HOME"
java -version
