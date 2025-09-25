// Subject functionality
document.addEventListener('DOMContentLoaded', () => {
    // Student section (keep existing)
    if (document.getElementById('addStudentButton')) {
        document.getElementById('addStudentButton').addEventListener('click', addStudent);
        displayStudents();
    }

    // Subject section
    if (document.getElementById('addSubject')) {
        document.getElementById('addSubject').addEventListener('click', addSubject);
        displaySubjects();
    }
});

function addSubject() {
    const subjectCode = document.getElementById('subjectCode').value.trim();
    const subjectName = document.getElementById('subjectName').value.trim();
    const units = document.getElementById('units').value.trim();

    if (!subjectCode || !subjectName || !units) {
        alert('Please fill in all fields.');
        return;
    }

    // Get existing subjects from localStorage or initialize empty array
    let subjects = JSON.parse(localStorage.getItem('subjects')) || [];

    // Optional: Prevent duplicate subject codes
    if (subjects.some(s => s.subjectCode === subjectCode)) {
        alert('Subject code already exists!');
        return;
    }

    // Add new subject
    subjects.push({
        subjectCode: subjectCode,
        subjectName: subjectName,
        units: units
    });

    // Save back to localStorage
    localStorage.setItem('subjects', JSON.stringify(subjects));

    // Clear form
    document.getElementById('subjectCode').value = '';
    document.getElementById('subjectName').value = '';
    document.getElementById('units').value = '';

    // Refresh table
    displaySubjects();

    alert('Subject added successfully!');
}

function displaySubjects() {
    const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
    const tableContent = document.getElementById('table-content');
    if (!tableContent) return;

    tableContent.innerHTML = subjects.map(subject => `
        <tr>
            <td>${subject.subjectCode}</td>
            <td>${subject.subjectName}</td>
            <td>${subject.units}</td>
        </tr>
    `).join('');
}