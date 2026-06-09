# Diseño Visual - WhatsApp Manager Pro

## Enfoque Seleccionado: Minimalismo Futurista Oscuro con Acentos Neon

### Filosofía de Diseño
Este diseño combina la elegancia del minimalismo moderno con elementos futuristas, creando una interfaz profesional pero visualmente cautivadora. La temática negro/verde evoca sofisticación tecnológica y control, perfecta para una plataforma de automatización de mensajería.

### Principios Centrales
1. **Contraste Intencional**: Negro profundo como base con verde neón (#10b981 o similar) como acento principal
2. **Minimalismo Funcional**: Solo elementos necesarios, sin decoración innecesaria
3. **Animaciones Sutiles**: Transiciones fluidas que refuerzan la interactividad sin distraer
4. **Jerarquía Clara**: Uso de espaciado y tipografía para guiar la atención

### Filosofía de Color
- **Fondo**: Negro profundo (oklch(0.1 0 0)) - transmite profesionalismo y reduce fatiga visual
- **Acentos Primarios**: Verde esmeralda (#10b981) - energía, crecimiento, confianza en tecnología
- **Acentos Secundarios**: Gris oscuro (#374151) para elementos secundarios
- **Textos**: Blanco puro (#ffffff) para máximo contraste en negro
- **Intención Emocional**: Control, profesionalismo, modernidad, confianza

### Paradigma de Layout
- **Navegación Lateral Persistente**: Sidebar oscuro con iconos verdes para acceso rápido a las 4 secciones
- **Contenido Principal Amplio**: Área de trabajo espaciosa con grid de 12 columnas
- **Tarjetas Flotantes**: Elementos con sombras suaves para crear profundidad
- **Divisores Animados**: Líneas verdes sutiles que separan secciones

### Elementos Distintivos
1. **Líneas Verdes Animadas**: Bordes izquierdos en tarjetas que se animan al pasar el mouse
2. **Iconografía Minimalista**: Lucide React icons en verde para acciones principales
3. **Badges Animados**: Indicadores de estado con pequeñas animaciones pulse

### Filosofía de Interacción
- **Feedback Inmediato**: Botones con escala y cambio de color al hacer clic
- **Hover Effects Sutiles**: Cambio de brillo en tarjetas, no movimiento excesivo
- **Transiciones Suaves**: Todas las animaciones en 200-300ms
- **Estados Visuales Claros**: Activo, inactivo, cargando, error

### Directrices de Animación
- **Entrada de Elementos**: Fade-in + slide-up en 300ms con ease-out
- **Hover en Botones**: Scale(1.05) en 150ms
- **Carga de Datos**: Skeleton loaders con gradiente animado
- **Transiciones de Página**: Fade suave en 200ms
- **Pulse en Elementos Activos**: Pequeño pulse cada 2s para indicadores de estado

### Sistema Tipográfico
- **Display**: Geist Sans (bold, 32px) - títulos principales
- **Heading**: Geist Sans (semibold, 20px) - títulos de sección
- **Body**: Inter (regular, 14px) - contenido principal
- **Small**: Inter (regular, 12px) - etiquetas y ayudas
- **Monospace**: JetBrains Mono (regular, 13px) - códigos y API keys

### Estructura de 4 Secciones
1. **Gestión de Números**: Tabla con números, estado de conexión, acciones
2. **Campañas**: Creador de campañas con vista previa, lista de campañas activas
3. **Automatización IA**: Configurador de flujos, integración Gemini, pruebas
4. **Datos**: Dashboard con gráficos, estadísticas, exportación

---

## Decisiones de Implementación
- Usar Framer Motion para animaciones fluidas
- Tailwind CSS para estilos con variables OKLCH
- Lucide React para iconografía
- Recharts para gráficos en la sección de datos
- LocalStorage para persistencia de datos demo
