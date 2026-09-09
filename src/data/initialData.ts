import { Teacher, MusicReadingSection } from '../types';

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'prof-1',
    name: 'Prof. Clara Schumann',
    department: 'Piano',
    username: 'clara',
    students: [
      {
        id: 'std-1',
        name: 'Mateo Fernández Soler',
        instrument: 'Piano',
        level: 'Grado Elemental 3',
        classDay: 'Lunes',
        classTime: '16:00',
        expectedRepertoire:
          '• J.S. Bach: Pequeños preludios y fugas (BWV 939, 941)\n• W.A. Mozart: Sonata en Do Mayor K. 545 (I y II mov.)\n• C. Czerny: Escuela de la velocidad Op. 299 (Estudios 1-6)\n• F. Chopin: Preludio Op. 28 Nº 4 en Mi menor\n• E. Granados: Valses poéticos (selección Nº 1 y 2)',
        recitalRepertoire:
          '1. J.S. Bach: Invención a dos voces Nº 4 en Re menor\n2. L.v. Beethoven: Sonata Op. 49 Nº 2 en Sol Mayor (I mov.)\n3. C. Debussy: Le Petit Nègre',
        examRepertoire:
          'Excelente control del toque leggiero en pasajes rápidos. Se recomienda reforzar la relajación de muñeca izquierda en arpegios amplios y regularidad del pedal.',
        technicalProgressNotes:
          'Excelente control del toque leggiero en pasajes rápidos. Se recomienda reforzar la relajación de muñeca izquierda en arpegios amplios y regularidad del pedal.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'present',
          '2026-09-21': 'present',
          '2026-09-28': 'justified',
          '2026-10-05': 'present',
        },
        weeklyTechnicalNotes: {
          '2026-09-07':
            'Sesión inaugural: Revisión de afinación y colocación postural. Excelente control del toque leggiero en pasajes rápidos. Se recomienda reforzar la relajación de muñeca izquierda en arpegios ampl',
          '2026-09-14':
            'Buen control en el pasaje técnico. Continuar con los ejercicios diarios con metrónomo y pulcritud de articulación.',
        },
        weeklyGrades: {
          '2026-09-07': 9.2,
          '2026-09-14': 8.8,
          '2026-09-21': 9.5,
          '2026-09-28': 9,
        },
      },
      {
        id: 'std-2',
        name: 'Sofía Valenzuela Gil',
        instrument: 'Piano',
        level: 'Grado Profesional 1',
        classDay: 'Lunes',
        classTime: '16:00',
        expectedRepertoire:
          '• J.S. Bach: El Clave bien temperado Vol. I (Preludio y Fuga en Do menor)\n• F. Chopin: Nocturno en Do sostenido menor Op. Póstumo\n• S. Rachmaninov: Elegía Op. 3 Nº 1\n• C. Debussy: Arabesque Nº 1\n• I. Albéniz: Suite Española (Asturias / Leyenda)',
        recitalRepertoire:
          '1. J.S. Bach: Preludio y Fuga Nº 2 en Do menor\n2. L.v. Beethoven: Sonata Op. 10 Nº 1 (Allegro molto)\n3. F. Chopin: Estudio Op. 10 Nº 3 "Tristesse"',
        examRepertoire:
          'Madurez interpretativa sobresaliente. Gran sonoridad cantábile en la melodía. Trabajar la independencia polifónica en los registros medios.',
        technicalProgressNotes:
          'Madurez interpretativa sobresaliente. Gran sonoridad cantábile en la melodía. Trabajar la independencia polifónica en los registros medios.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'present',
          '2026-09-21': 'present',
          '2026-09-28': 'present',
          '2026-10-05': 'present',
        },
        weeklyTechnicalNotes: {
          '2026-09-07':
            'Sesión inaugural: Revisión de afinación y colocación postural. Madurez interpretativa sobresaliente. Gran sonoridad cantábile en la melodía. Trabajar la independencia polifónica en los registro',
          '2026-09-14':
            'Buen control en el pasaje técnico. Continuar con los ejercicios diarios con metrónomo y pulcritud de articulación.',
        },
        weeklyGrades: {
          '2026-09-07': 9.2,
          '2026-09-14': 8.8,
          '2026-09-21': 9.5,
          '2026-09-28': 9,
        },
      },
      {
        id: 'std-1788974770928-n7lc',
        name: 'Nuevo Estudiante',
        instrument: 'Piano',
        level: 'Nivel Inicial',
        classDay: 'Lunes',
        classTime: '16:00',
        expectedRepertoire: '',
        recitalRepertoire: '',
        examRepertoire: '',
        technicalProgressNotes: '',
        attendance: {
          '2026-09-07': 'present',
        },
        weeklyTechnicalNotes: {
          '2026-09-07': 'Sesión inaugural: Revisión de afinación y colocación postural.',
          '2026-09-14':
            'Buen control en el pasaje técnico. Continuar con los ejercicios diarios con metrónomo y pulcritud de articulación.',
        },
        weeklyGrades: {
          '2026-09-07': 9.2,
          '2026-09-14': 8.8,
          '2026-09-21': 9.5,
          '2026-09-28': 9,
        },
      },
      {
        id: 'std-1788977152424-vyl3',
        name: 'Estudiante 3 (Cátedra Piano)',
        instrument: 'Piano',
        level: 'Grado Elemental 1',
        classDay: 'Lunes',
        classTime: '16:00',
        expectedRepertoire: '• Estudios elementales Czerny Op. 599\n• Piezas infantiles de Schumann',
        recitalRepertoire: 'Minueto en Sol Mayor',
        examRepertoire: '',
        technicalProgressNotes: 'Buen avance inicial.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'present',
          '2026-09-21': 'present',
          '2026-09-28': 'present',
          '2026-10-05': 'present',
          '2026-10-12': 'present',
          '2026-10-19': 'present',
          '2026-10-26': 'present',
        },
        weeklyTechnicalNotes: {
          '2026-09-07': 'Sesión inaugural: Revisión de afinación y colocación postural.',
          '2026-09-14':
            'Buen control en el pasaje técnico. Continuar con los ejercicios diarios con metrónomo y pulcritud de articulación.',
        },
        weeklyGrades: {
          '2026-09-07': 9,
          '2026-09-14': 1,
          '2026-09-21': 4,
          '2026-09-28': 5,
        },
      },
    ],
  },
  {
    id: 'prof-2',
    name: 'Prof. Niccolò Paganini',
    department: 'Cuerda Frotada (Violín y Viola)',
    username: 'niccolo',
    students: [
      {
        id: 'std-3',
        name: 'Alejandro Morales Cruz',
        instrument: 'Violín',
        level: 'Grado Elemental 2',
        classDay: 'Lunes',
        classTime: '16:00',
        expectedRepertoire:
          '• O. Rieding: Concierto en Si menor Op. 35 (I mov.)\n• H. Schradieck: Escuela de la técnica del violín (Sección 1)\n• Wohlfahrt: 60 Estudios Op. 45 (Estudios 1 a 10)\n• A. Vivaldi: Concierto en La menor Op. 3 Nº 6 (Allegro)',
        recitalRepertoire:
          '1. J.S. Bach: Minueto en Sol Mayor\n2. O. Rieding: Concierto Op. 35 (Completo)\n3. Escala y arpegios en dos octavas (Sol M y La M)',
        examRepertoire:
          'Buen progreso en el golpe de arco détaché y distribución sonora. Prestar atención a la colocación del pulgar izquierdo en primera posición para evitar tensión.',
        technicalProgressNotes:
          'Buen progreso en el golpe de arco détaché y distribución sonora. Prestar atención a la colocación del pulgar izquierdo en primera posición para evitar tensión.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'absent',
          '2026-09-21': 'present',
          '2026-09-28': 'present',
          '2026-10-05': 'present',
        },
        weeklyTechnicalNotes: {
          '2026-09-07':
            'Sesión inaugural: Revisión de afinación y colocación postural. Buen progreso en el golpe de arco détaché y distribución sonora. Prestar atención a la colocación del pulgar izquierdo en primera',
          '2026-09-14':
            'Buen control en el pasaje técnico. Continuar con los ejercicios diarios con metrónomo y pulcritud de articulación.',
        },
        weeklyGrades: {
          '2026-09-07': 9.2,
          '2026-09-14': 8.8,
          '2026-09-21': 9.5,
          '2026-09-28': 9,
        },
      },
    ],
  },
  {
    id: 'prof-3',
    name: 'Prof. Andrés Segovia',
    department: 'Guitarra Clásica',
    username: 'andres',
    students: [],
  },
  {
    id: 'prof-1788975059873',
    name: 'Prof. Temporal De Prueba',
    department: 'Percusión',
    username: 'proftemp',
    students: [],
  },
];

export const INITIAL_MUSIC_READING_SECTIONS: MusicReadingSection[] = [
  {
    id: 'sec-lm-1',
    name: 'Lectura Musical y Rítmica - Grupo A',
    level: 'Grado Elemental 1 y 2',
    teacherId: 'prof-1',
    teacherName: 'Prof. Clara Schumann',
    dayOfWeek: 'Sábado',
    classTime: '10:00',
    room: 'Aula Magna 2',
    studentIds: ['std-1', 'std-1788974770928-n7lc', 'std-2'],
    createdAt: '2026-09-09 18:01:55',
    sessions: {
      '2026-09-12': {
        date: '2026-09-12',
        weekKey: '2026-09-07',
        topic: 'Figuras rítmicas básicas, compás de 4/4 y lectura en Clave de Sol',
        generalComment:
          'Excelente entusiasmo del grupo en la lectura coral de rítmicas a una voz y dictado de alturas do-sol.',
        records: {
          'std-1': {
            studentId: 'std-1',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9.5,
            studentComment: 'Participación muy activa en el solfeo hablado.',
          },
          'std-1788974770928-n7lc': {
            studentId: 'std-1788974770928-n7lc',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9,
            studentComment: 'Dictado rítmico completado con precisión.',
          },
          'std-2': {
            studentId: 'std-2',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: false,
            grade: 8.5,
            studentComment: 'Buena entonación; repasar la caligrafía en pentagrama.',
          },
        },
      },
      '2026-09-19': {
        date: '2026-09-19',
        weekKey: '2026-09-14',
        topic: 'Subdivisión ternaria, corcheas y solfeo entonado por grados conjuntos',
        generalComment: 'Práctica con percusión corporal y lectura a dos voces.',
        records: {
          'std-1': {
            studentId: 'std-1',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9.8,
            studentComment: 'Solfeo a primera vista impecable.',
          },
          'std-1788974770928-n7lc': {
            studentId: 'std-1788974770928-n7lc',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: true,
            grade: 9.2,
            studentComment: 'Excelente sincronía rítmica con el grupo.',
          },
          'std-2': {
            studentId: 'std-2',
            attendance: 'justified',
            participatedTheory: false,
            participatedWritten: false,
            grade: null,
            studentComment: 'Falta justificada por examen escolar.',
          },
        },
      },
    },
  },
  {
    id: 'sec-lm-2',
    name: 'Lectura Musical y Lenguaje Avanzado - Grupo B',
    level: 'Grado Medio / Profesional',
    teacherId: 'prof-2',
    teacherName: 'Prof. Niccolò Paganini',
    dayOfWeek: 'Viernes',
    classTime: '17:30',
    room: 'Aula 3 de Teclados',
    studentIds: ['std-2', 'std-3', 'std-1', 'std-1788977152424-vyl3'],
    createdAt: '2026-09-09 18:01:55',
    sessions: {
      '2026-09-07': {
        date: '2026-09-11',
        weekKey: '2026-09-07',
        topic: '',
        generalComment: '',
        records: {
          'std-1788977152424-vyl3': {
            studentId: 'std-1788977152424-vyl3',
            attendance: 'present',
            participatedTheory: true,
            participatedWritten: false,
            grade: 10,
            studentComment: '',
          },
        },
      },
    },
  },
];
