# Documentation Templates

## Component Reference Template

````markdown
### [Component Name]

[Brief description of purpose.]

**Props**
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `propName` | `string` | `''` | [Description] |

**Usage Example**

```tsx
<ComponentName propName="value" />
```
````

````

## Logic/Store Reference Template
```markdown
### [Store Name]
[Brief description of the state managed.]

**State**
- `key`: `Type` - [Description]

**Actions**
- `actionName(param: Type)`: [Description of the transformation.]

**Persistence**
[Details on where and how the data is stored.]
````

## Feature Update Template

```markdown
### FEATURE: [Feature Name]

[One sentence on why this was added.]

#### Changes

- **File**: `[Path]`
- **Logic**: [Technical details on implementation.]
- **UI**: [Changes to components/views.]

#### Verification

- [List of tests run or manual checks.]
```
