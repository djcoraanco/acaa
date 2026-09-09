import { Teacher } from '../types';

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'prof-1',
    name: 'Prof. Clara Schumann',
    department: 'Piano Clásico y Teclado',
    students: [
      {
        id: 'std-1',
        name: 'Mateo Fernández Soler',
        instrument: 'Piano',
        level: 'Grado Elemental 3',
        expectedRepertoire: '• J.S. Bach: Pequeños preludios y fugas (BWV 939, 941)\n• W.A. Mozart: Sonata en Do Mayor K. 545 (I y II mov.)\n• C. Czerny: Escuela de la velocidad Op. 299 (Estudios 1-6)',
        recitalRepertoire: '• F. Chopin: Preludio Op. 28 Nº 4 en Mi menor\n• E. Granados: Valses poéticos (selección Nº 1 y 2)',
        examRepertoire: '1. J.S. Bach: Invención a dos voces Nº 4 en Re menor\n2. L.v. Beethoven: Sonata Op. 49 Nº 2 en Sol Mayor (I mov.)\n3. C. Debussy: Le Petit Nègre',
        technicalProgressNotes: 'Excelente control del toque leggiero en pasajes rápidos. Se recomienda reforzar la relajación de muñeca izquierda en arpegios amplios y la regularidad del pedal tonal.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'present',
          '2026-09-21': 'present',
          '2026-09-28': 'justified',
          '2026-10-05': 'present',
        },
      },
      {
        id: 'std-2',
        name: 'Sofía Valenzuela Gil',
        instrument: 'Piano',
        level: 'Grado Profesional 1',
        expectedRepertoire: '• J.S. Bach: El Clave bien temperado Vol. I (Preludio y Fuga en Do menor)\n• F. Chopin: Nocturno en Do sostenido menor Op. Póstumo\n• S. Rachmaninov: Elegía Op. 3 Nº 1',
        recitalRepertoire: '• C. Debussy: Arabesque Nº 1\n• I. Albéniz: Suite Española (Asturias / Leyenda)',
        examRepertoire: '1. J.S. Bach: Preludio y Fuga Nº 2 en Do menor\n2. L.v. Beethoven: Sonata Op. 10 Nº 1 (Allegro molto)\n3. F. Chopin: Estudio Op. 10 Nº 3 "Tristesse"',
        technicalProgressNotes: 'Madurez interpretativa sobresaliente. Gran sonoridad cantábile en la melodía. Trabajar la independencia polifónica en los registros medios.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'present',
          '2026-09-21': 'present',
          '2026-09-28': 'present',
          '2026-10-05': 'present',
        },
      },
    ],
  },
  {
    id: 'prof-2',
    name: 'Prof. Niccolò Paganini',
    department: 'Cuerda Frotada (Violín y Viola)',
    students: [
      {
        id: 'std-3',
        name: 'Alejandro Morales Cruz',
        instrument: 'Violín',
        level: 'Grado Elemental 2',
        expectedRepertoire: '• O. Rieding: Concierto en Si menor Op. 35 (I mov.)\n• H. Schradieck: Escuela de la técnica del violín (Sección 1)\n• Wohlfahrt: 60 Estudios Op. 45 (Estudios 1 a 10)',
        recitalRepertoire: '• A. Vivaldi: Concierto en La menor Op. 3 Nº 6 (Allegro)',
        examRepertoire: '1. J.S. Bach: Minueto en Sol Mayor\n2. O. Rieding: Concierto Op. 35 (Completo)\n3. Escala y arpegios en dos octavas (Sol M y La M)',
        technicalProgressNotes: 'Buen progreso en el golpe de arco détaché y distribución sonora. Prestar atención a la colocación del pulgar izquierdo en primera posición para evitar tensión.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'absent',
          '2026-09-21': 'present',
          '2026-09-28': 'present',
          '2026-10-05': 'present',
        },
      },
    ],
  },
  {
    id: 'prof-3',
    name: 'Prof. Andrés Segovia',
    department: 'Guitarra Clásica',
    students: [
      {
        id: 'std-4',
        name: 'Lucía Navarro Rivas',
        instrument: 'Guitarra',
        level: 'Grado Elemental 4',
        expectedRepertoire: '• F. Sor: 24 Estudios progresivos Op. 31 (Nº 1, 3, 5)\n• L. Brouwer: Estudios sencillos (I al V)\n• F. Tárrega: Lágrima y Adelita',
        recitalRepertoire: '• F. Tárrega: Recuerdos de la Alhambra (técnica de trémolo)\n• Gaspar Sanz: Canarios',
        examRepertoire: '1. J.S. Bach: Bourrée en Mi menor (BWV 996)\n2. F. Carulli: Sonata en Do Mayor\n3. L. Brouwer: Danza característica',
        technicalProgressNotes: 'Proyección tímbrica rica y cuidada pulsación apoyada en la mano derecha. Continuar los ejercicios diarios de coordinación metronómica en escalas rápidas.',
        attendance: {
          '2026-09-07': 'present',
          '2026-09-14': 'present',
          '2026-09-21': 'justified',
          '2026-09-28': 'present',
          '2026-10-05': 'present',
        },
      },
    ],
  },
];
