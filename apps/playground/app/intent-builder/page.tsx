"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Sidebar from "@/components/sidebar"

interface IntentField {
  name: string
  type: "string" | "number" | "boolean" | "array" | "object"
  required: boolean
  description: string
}

interface IntentSchema {
  name: string
  description: string
  layout: "list" | "grid" | "cards" | "table" | "custom"
  fields: IntentField[]
  template?: string
}

export default function IntentBuilderPage() {
  const [schema, setSchema] = useState<IntentSchema>({
    name: "",
    description: "",
    layout: "list",
    fields: [],
    template: ""
  })

  const [currentField, setCurrentField] = useState<IntentField>({
    name: "",
    type: "string",
    required: false,
    description: ""
  })

  const [preview, setPreview] = useState("")

  const addField = () => {
    if (!currentField.name) {
      alert("Field name is required")
      return
    }

    setSchema({
      ...schema,
      fields: [...schema.fields, currentField]
    })

    setCurrentField({
      name: "",
      type: "string",
      required: false,
      description: ""
    })
  }

  const removeField = (index: number) => {
    setSchema({
      ...schema,
      fields: schema.fields.filter((_, i) => i !== index)
    })
  }

  const generateSchema = () => {
    const json = JSON.stringify(schema, null, 2)
    setPreview(json)
  }

  const exportSchema = () => {
    const json = JSON.stringify(schema, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${schema.name || "intent-schema"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setSchema(imported)
      } catch (error) {
        alert("Invalid JSON file")
      }
    }
    reader.readAsText(file)
  }

  const loadTemplate = (template: string) => {
    const templates: Record<string, IntentSchema> = {
      balance: {
        name: "balance_response",
        description: "Format balance check responses",
        layout: "cards",
        fields: [
          { name: "chain", type: "string", required: true, description: "Chain name" },
          { name: "address", type: "string", required: true, description: "Wallet address" },
          { name: "balance", type: "string", required: true, description: "Balance amount" },
          { name: "symbol", type: "string", required: true, description: "Token symbol" }
        ]
      },
      transfer: {
        name: "transfer_response",
        description: "Format transfer transaction responses",
        layout: "list",
        fields: [
          { name: "from", type: "string", required: true, description: "Sender address" },
          { name: "to", type: "string", required: true, description: "Recipient address" },
          { name: "amount", type: "string", required: true, description: "Transfer amount" },
          { name: "txHash", type: "string", required: true, description: "Transaction hash" },
          { name: "status", type: "string", required: true, description: "Transaction status" }
        ]
      }
    }

    if (templates[template]) {
      setSchema(templates[template])
    }
  }

  return (
    <div className="modern-container">
      <div className="flex h-screen">
        <Sidebar currentPage="intent-builder" />

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold modern-text-primary">Intent Schema Builder</h1>
                <p className="text-sm modern-text-secondary mt-1">
                  Define response formats for AI agent outputs
                </p>
              </div>
              <Badge className="modern-badge">Beta</Badge>
            </div>

            {/* Templates */}
            <Card className="modern-card p-4">
              <h3 className="text-sm font-semibold mb-3">Quick Start Templates</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate("balance")}
                  className="modern-button-secondary"
                >
                  Balance Response
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate("transfer")}
                  className="modern-button-secondary"
                >
                  Transfer Response
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Schema Configuration */}
              <div className="space-y-6">
                <Card className="modern-card p-6">
                  <h2 className="text-xl font-semibold mb-4">Schema Configuration</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="schema-name" className="text-sm font-medium">
                        Schema Name *
                      </Label>
                      <Input
                        id="schema-name"
                        value={schema.name}
                        onChange={(e) => setSchema({ ...schema, name: e.target.value })}
                        placeholder="e.g., balance_response"
                        className="modern-input mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="schema-desc" className="text-sm font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="schema-desc"
                        value={schema.description}
                        onChange={(e) => setSchema({ ...schema, description: e.target.value })}
                        placeholder="Describe what this schema is for..."
                        className="modern-input mt-1"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="layout" className="text-sm font-medium">
                        Layout Type *
                      </Label>
                      <Select
                        value={schema.layout}
                        onValueChange={(value: any) => setSchema({ ...schema, layout: value })}
                      >
                        <SelectTrigger className="modern-input mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="list">List</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="cards">Cards</SelectItem>
                          <SelectItem value="table">Table</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {schema.layout === "custom" && (
                      <div>
                        <Label htmlFor="template" className="text-sm font-medium">
                          Custom Template
                        </Label>
                        <Textarea
                          id="template"
                          value={schema.template || ""}
                          onChange={(e) => setSchema({ ...schema, template: e.target.value })}
                          placeholder="Use {{fieldName}} for placeholders"
                          className="modern-input mt-1 font-mono text-xs"
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Add Field */}
                <Card className="modern-card p-6">
                  <h2 className="text-xl font-semibold mb-4">Add Field</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="field-name" className="text-sm font-medium">
                        Field Name *
                      </Label>
                      <Input
                        id="field-name"
                        value={currentField.name}
                        onChange={(e) =>
                          setCurrentField({ ...currentField, name: e.target.value })
                        }
                        placeholder="e.g., balance"
                        className="modern-input mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="field-type" className="text-sm font-medium">
                        Type *
                      </Label>
                      <Select
                        value={currentField.type}
                        onValueChange={(value: any) =>
                          setCurrentField({ ...currentField, type: value })
                        }
                      >
                        <SelectTrigger className="modern-input mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="array">Array</SelectItem>
                          <SelectItem value="object">Object</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="field-desc" className="text-sm font-medium">
                        Description
                      </Label>
                      <Input
                        id="field-desc"
                        value={currentField.description}
                        onChange={(e) =>
                          setCurrentField({ ...currentField, description: e.target.value })
                        }
                        placeholder="Field description..."
                        className="modern-input mt-1"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="field-required"
                        checked={currentField.required}
                        onChange={(e) =>
                          setCurrentField({ ...currentField, required: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <Label htmlFor="field-required" className="text-sm">
                        Required field
                      </Label>
                    </div>

                    <Button onClick={addField} className="w-full modern-button">
                      Add Field
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Fields List & Preview */}
              <div className="space-y-6">
                <Card className="modern-card p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Fields ({schema.fields.length})
                  </h2>

                  {schema.fields.length === 0 ? (
                    <p className="text-sm modern-text-secondary text-center py-8">
                      No fields added yet. Add fields using the form on the left.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {schema.fields.map((field, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 modern-card border border-white/10 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{field.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {field.type}
                              </Badge>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">
                                  required
                                </Badge>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs modern-text-secondary mt-1">
                                {field.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeField(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="modern-card p-6">
                  <h2 className="text-xl font-semibold mb-4">Schema JSON</h2>
                  <div className="space-y-4">
                    <Button onClick={generateSchema} className="w-full modern-button">
                      Generate Schema
                    </Button>

                    {preview && (
                      <div className="space-y-2">
                        <Textarea
                          value={preview}
                          readOnly
                          className="modern-input font-mono text-xs"
                          rows={12}
                        />
                        <div className="flex gap-2">
                          <Button onClick={exportSchema} className="flex-1 modern-button-secondary">
                            Export JSON
                          </Button>
                          <Button
                            onClick={() => navigator.clipboard.writeText(preview)}
                            className="flex-1 modern-button-secondary"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="import-file" className="text-sm font-medium">
                        Import Schema
                      </Label>
                      <Input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={importSchema}
                        className="modern-input mt-1"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

