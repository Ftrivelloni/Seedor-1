"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

export default function CreateFieldForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [fieldName, setFieldName] = useState("");
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fieldName || !location || !size) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // This is a placeholder for the actual API call
      // In a real implementation, you would submit to your API
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Campo creado exitosamente");
      router.push("/campo"); // Redirect to fields list
    } catch (error) {
      console.error("Error creating field:", error);
      toast.error("Error al crear el campo. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Crear Nuevo Campo</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fieldName">Nombre del Campo *</Label>
            <Input
              id="fieldName"
              placeholder="Ingresa un nombre para tu campo"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Input
              id="location"
              placeholder="Ubicación (provincia, localidad)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="size">Tamaño (hectáreas) *</Label>
            <Input
              id="size"
              type="number"
              placeholder="100"
              min="1"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe tu campo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creando..." : "Crear Campo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}