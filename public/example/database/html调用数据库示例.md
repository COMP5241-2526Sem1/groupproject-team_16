1.启动服务 
node server.js

2.拼接url进入页面
https://xxxxxxxxxxxxxx.app.github.dev/example/database/database-example.html

3.html传参数调用，绑定参考llm-example.html/js

调用路径：

llm-example.html -> database-example.js -> server.js
 -> api/database/database_manager.js -> database

 测试建表：
 -- 用户表（存储老师和学生的共同信息）
CREATE TABLE `user` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `username` TEXT NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `name` TEXT NOT NULL,
  `role` TEXT CHECK(role IN ('teacher', 'student')) NOT NULL,
  `email` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 课程表
CREATE TABLE `course` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `course_code` TEXT NOT NULL UNIQUE,
  `course_name` TEXT NOT NULL,
  `credit` INTEGER NOT NULL,
  `teacher_id` INTEGER NOT NULL,
  `start_date` DATE,
  `end_date` DATE,
  FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);

-- 学生选课表
CREATE TABLE `student_course` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `student_id` INTEGER NOT NULL,
  `course_id` INTEGER NOT NULL,
  `selected_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`student_id`, `course_id`),
  FOREIGN KEY (`student_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON DELETE CASCADE
);

-- 成绩表
CREATE TABLE `grade` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `student_course_id` INTEGER NOT NULL UNIQUE,
  `score` REAL CHECK (`score` BETWEEN 0 AND 100),
  `grade_point` REAL,
  `teacher_id` INTEGER NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_course_id`) REFERENCES `student_course`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`)
);
    


