# Sistema de Gestión de Vehículos - SONIA

Este es un sistema web para la gestión de vehículos que permite registrar, listar y gestionar el estado de los vehículos.

## Características

- Registro de vehículos con los siguientes campos:
  - Modelo
  - Matrícula
  - Año
  - Tipo
  - Precio
  - Capacidad
  - Estado

- Listado de vehículos con filtros por estado:
  - Libre
  - Reservado
  - Mantenimiento

- Funcionalidades:
  - Registro de nuevos vehículos
  - Cambio de estado de vehículos
  - Filtrado por estado
  - Búsqueda de vehículos disponibles

## Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Font Awesome
- LocalStorage para persistencia de datos

## Cómo Usar

1. Abre el archivo `index.html` en tu navegador web
2. Para registrar un nuevo vehículo:
   - Completa el formulario en el panel izquierdo
   - Haz clic en "Registrar Vehículo"
3. Para filtrar vehículos:
   - Usa el selector de estado en la parte superior de la tabla
   - O haz clic en "Disponibles" para ver solo vehículos libres
4. Para cambiar el estado de un vehículo:
   - Haz clic en el botón de edición (ícono de lápiz)
   - Selecciona el nuevo estado en el modal
   - Haz clic en "Guardar Cambios"

## Notas

- Los datos se almacenan en el localStorage del navegador
- La interfaz es responsiva y se adapta a diferentes tamaños de pantalla
- Los estados se muestran con códigos de color para mejor visualización:
  - Verde: Libre
  - Amarillo: Reservado
  - Rojo: Mantenimiento 