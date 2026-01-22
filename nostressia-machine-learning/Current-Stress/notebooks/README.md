Student Lifestyle and Stress Dataset Overview 📊

Objective 🎯
This dataset examines how students’ daily routines impact their stress levels and academic outcomes. It captures lifestyle habits such as studying, sleeping, exercising, socializing, involvement in extracurricular activities, and GPA, which together affect stress.

Key Features 🔑

Size and Structure 📏

- Total records: 2,000
- Total columns: 8
- Includes a mix of numeric and categorical data

Attributes 📋

Lifestyle Habits

- ⏱ **Daily Study Hours:** Amount of time spent on studying each day
- 🛌 **Daily Sleep Hours:** Time spent sleeping
- 🤸 **Daily Physical Activity:** Hours dedicated to exercise
- 🗨️ **Daily Social Hours:** Time spent interacting with peers
- 🎨 **Extracurricular Hours:** Time spent on clubs or other activities

Academic Performance

- 🎓 **GPA:** Represents students’ overall academic achievement

Stress Levels

- ⚡ **Stress Level:** Classified as **Low**, **Moderate**, or **High** to show stress intensity

Categorical Features 🏷️

- ⚡ **Stress_Level** is converted into `Stress_Level_Encoded` for predictive modeling
- 🎓 **Academic Performance** is categorized into Excellent, Good, Fair, or Poor based on GPA and encoded

Target Variable 🎯

- The dataset aims to predict **Stress Level** for each student

Data Insights 📊

Stress and Lifestyle Correlation 🧠

- 🔥 Students with **High Stress** usually study more and sleep less
- ⚖️ **Moderate Stress** indicates a balanced mix of academic work and personal activities
- 🌿 Students with **Low Stress** tend to maintain good physical activity and social engagement

Feature Importance 🔍

- ⏱ **Daily Study Hours** and 🛌 **Daily Sleep Hours** are the strongest predictors of stress levels

Class Distribution

- The majority of students fall into **Moderate** or **High Stress**, while relatively few experience **Low Stress**
