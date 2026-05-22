# pinia-plugin-persistedstate 持久化配置详解

> 项目使用版本：`pinia-plugin-persistedstate@~4.7.1`

## persist 类型签名

```typescript
type Persist<State = any> =
  | boolean
  | PersistenceOptions<State>
  | PersistenceOptions<State>[]
```

`persist` 可以是：

- **`true`**：使用所有默认值开启持久化
- **对象**：`PersistenceOptions` 配置对象
- **数组**：多个 `PersistenceOptions`，用于将不同字段持久化到不同存储中

---

## PersistenceOptions 所有选项

### 1. `key`

- **类型**：`string`
- **默认值**：`store.$id`（即 store 的名称）
- **用途**：在 storage 中存储数据时使用的键名

```typescript
persist: {
  key: 'my-custom-key', // 在 localStorage 中存储为 "my-custom-key"
}
```

---

### 2. `storage`

- **类型**：`StorageLike`（需要有 `getItem` 和 `setItem` 方法）
- **默认值**：`localStorage`
- **用途**：指定持久化的目标存储引擎

```typescript
persist: {
  storage: sessionStorage, // 使用 sessionStorage
}

// 也可以自定义存储
persist: {
  storage: {
    getItem: (key) => cookies.get(key),
    setItem: (key, value) => cookies.set(key, value),
  },
}
```

> ⚠️ Storage 必须是**同步的**，不支持异步存储（如 IndexedDB）。

---

### 3. `pick`

- **类型**：`string[] | Path<StateTree>[]`
- **默认值**：`undefined`（持久化整个 state）
- **用途**：**白名单**——只持久化指定的 state 属性，支持**点号路径**（dot-notation）引用嵌套属性

```typescript
// 只持久化 user 字段
persist: {
  pick: ['user'],
}

// 嵌套路径示例
persist: {
  pick: ['user.name', 'user.age', 'token'],
}
```

- `[]` 空数组 = 不持久化任何状态
- `undefined` = 持久化全部状态

---

### 4. `omit`

- **类型**：`string[] | Path<StateTree>[]`
- **默认值**：`undefined`
- **用途**：**黑名单**——排除指定的 state 属性，其余全部持久化

```typescript
persist: {
  omit: ['token', 'tempData'], // 除了 token 和 tempData，其余都持久化
}
```

> 💡 `pick` 和 `omit` **不要同时使用**，它们是互斥的。

---

### 5. `serializer`

- **类型**：`Serializer`（包含 `serialize` 和 `deserialize` 方法）
- **默认值**：`JSON.stringify` / `destr`（比 `JSON.parse` 更安全的反序列化库）
- **用途**：自定义序列化/反序列化逻辑

```typescript
import { parse, stringify } from 'zipson'

persist: {
  serializer: {
    deserialize: parse,   // 反序列化（从 storage 读取时）
    serialize: stringify, // 序列化（写入 storage 时）
  },
}
```

---

### 6. `beforeHydrate`

- **类型**：`(context: PiniaPluginContext) => void`
- **默认值**：`undefined`
- **用途**：在 store 从 storage **恢复（水合）数据之前**执行的钩子函数

```typescript
persist: {
  beforeHydrate: (ctx) => {
    console.log('即将从 storage 恢复数据到 store:', ctx.store.$id)
  },
}
```

---

### 7. `afterHydrate`

- **类型**：`(context: PiniaPluginContext) => void`
- **默认值**：`undefined`
- **用途**：在 store 从 storage **恢复（水合）数据之后**执行的钩子函数

```typescript
persist: {
  afterHydrate: (ctx) => {
    console.log('store 数据已从 storage 恢复完成:', ctx.store.$id)
  },
}
```

---

### 8. `debug`

- **类型**：`boolean`
- **默认值**：`false`
- **用途**：开启调试模式，会在控制台输出持久化相关的日志信息，方便排查问题

```typescript
persist: {
  debug: true,
}
```

---

## 默认行为总结

| 选项 | 默认值 |
|------|--------|
| `key` | `store.$id` |
| `storage` | `localStorage` |
| `serializer` | `JSON.stringify` / `destr` |
| `pick` | `undefined`（全部持久化）|
| `omit` | `undefined`（不排除）|
| `beforeHydrate` | `undefined` |
| `afterHydrate` | `undefined` |
| `debug` | `false` |

---

## 完整使用示例

### 基础用法

```typescript
// 开启默认持久化
persist: true
```

### 选择性持久化（白名单）

```typescript
// 只持久化 user 字段
persist: {
  pick: ['user'],
}
```

### 排除性持久化（黑名单）

```typescript
// 排除 token 和 tempData，其余都持久化
persist: {
  omit: ['token', 'tempData'],
}
```

### 使用 sessionStorage

```typescript
persist: {
  storage: sessionStorage,
}
```

### 自定义存储键名

```typescript
persist: {
  key: 'app-user-data',
}
```

### 数组形式（不同字段存储到不同位置）

```typescript
persist: [
  {
    key: 'user-info',
    pick: ['user'],
    storage: localStorage,
  },
  {
    key: 'user-session',
    pick: ['isLoggedIn'],
    storage: sessionStorage,
  },
]
```

### 完整配置示例

```typescript
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref<IMobileUser | null>(null)
    const token = ref<string>('')
    const isLoggedIn = computed(() => !!user.value)

    const setUser = (newUser: IMobileUser): void => {
      user.value = newUser
    }

    const logout = (): void => {
      user.value = null
      token.value = ''
    }

    return { user, token, isLoggedIn, logout, setUser }
  },
  {
    persist: {
      key: 'app-user',
      storage: localStorage,
      pick: ['user', 'token'],
      debug: import.meta.env.DEV,
      afterHydrate: (ctx) => {
        console.log('用户数据恢复完成')
      },
    },
  },
)
```

---

## 参考链接

- [官方文档 - Configuration](https://prazdevs.github.io/pinia-plugin-persistedstate/guide/config.html)
- [GitHub 仓库](https://github.com/prazdevs/pinia-plugin-persistedstate)
