-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID REFERENCES users(id) PRIMARY KEY,
    student_id VARCHAR UNIQUE NOT NULL,
    department VARCHAR NOT NULL,
    semester INTEGER NOT NULL,
    phone VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Teachers table
CREATE TABLE teachers (
    id UUID REFERENCES users(id) PRIMARY KEY,
    teacher_id VARCHAR UNIQUE NOT NULL,
    department VARCHAR NOT NULL,
    subjects TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    department VARCHAR NOT NULL,
    semester INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Timetable table
CREATE TABLE timetable (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES teachers(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lectures table
CREATE TABLE lectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES teachers(id),
    qr_code VARCHAR UNIQUE NOT NULL,
    qr_expires_at TIMESTAMP NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lecture_id UUID REFERENCES lectures(id),
    student_id UUID REFERENCES students(id),
    marked_at TIMESTAMP DEFAULT NOW(),
    device_fingerprint VARCHAR,
    ip_address INET,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    UNIQUE(lecture_id, student_id)
);

-- Anomaly logs table
CREATE TABLE anomaly_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type VARCHAR NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR CHECK (severity IN ('low', 'medium', 'high')),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attendance_student_lecture ON attendance(student_id, lecture_id);
CREATE INDEX idx_lectures_qr_code ON lectures(qr_code);
CREATE INDEX idx_lectures_expires ON lectures(qr_expires_at);
CREATE INDEX idx_anomaly_logs_created ON anomaly_logs(created_at);
CREATE INDEX idx_anomaly_logs_user ON anomaly_logs(user_id);