# 0009. Identidad enchufable desde el primer día

**Estado:** aceptada

## Contexto

Si el producto se instala en empresas, lo normal es que cada una quiera entrar con sus cuentas corporativas (directorio activo, LDAP, Google, SAML). Añadir eso tarde a un sistema que asume contraseñas locales es caro.

## Decisión

El backend solo trabaja con un identificador de usuario, roles, permisos y alcance. No sabe cómo se autenticó la persona. La autenticación es una interfaz con implementaciones intercambiables por configuración.

Para comprobar que la interfaz no era decorativa, implementé un segundo proveedor real (LDAP) y lo probé contra un servidor real: contraseña correcta, incorrecta, vacía, usuario inexistente y usuario desactivado en la aplicación con contraseña LDAP correcta (que debe fallar, y falla).

Una trampa conocida que quedó cubierta: una contraseña vacía se rechaza antes de llegar a LDAP. Muchos servidores aceptan un *bind* sin contraseña como un éxito anónimo.

## Consecuencias

- (+) Conectar el directorio de un cliente es configuración.
- (+) Los permisos siguen viviendo en la aplicación, sea cual sea el proveedor.
- (-) No hay aprovisionamiento automático: la persona tiene que existir antes en la aplicación.
- (~) LDAP quedó probado pero no se usa en ningún entorno. Su contenedor pasó a ser opcional cuando su imagen dejó de recibir parches.
