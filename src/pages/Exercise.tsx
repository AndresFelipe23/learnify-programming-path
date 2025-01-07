import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import CodeEditor from "@/components/CodeEditor";

const Exercise = () => {
  const { exerciseId } = useParams();
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const { data: exercise, isLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select(`
          *,
          lesson:lessons(
            *,
            module:modules(
              *,
              course:courses(*)
            )
          )
        `)
        .eq("id", exerciseId)
        .single();

      if (error) throw error;
      if (data.initial_code && !code) {
        setCode(data.initial_code);
      }
      return data;
    },
  });

  const runCode = async () => {
    setIsRunning(true);
    setOutput("");
    
    try {
      // Aquí implementaremos la lógica para ejecutar el código
      // Por ahora solo mostraremos el código en la consola
      console.log("Código a ejecutar:", code);
      setOutput("// Resultado de la ejecución\nconsole.log('¡Hola mundo!');");
      toast.success("¡Código ejecutado correctamente!");
    } catch (error) {
      console.error("Error al ejecutar el código:", error);
      toast.error("Error al ejecutar el código");
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{exercise?.title}</h1>
        <p className="text-muted-foreground">
          {exercise?.lesson?.module?.course?.title} &gt;{" "}
          {exercise?.lesson?.module?.title} &gt; {exercise?.lesson?.title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Descripción</h2>
            <p className="text-muted-foreground mb-4">{exercise?.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>Puntos: {exercise?.points}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Resultado</h2>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px]">
              <code>{output || "// El resultado se mostrará aquí"}</code>
            </pre>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Editor de código</h2>
              <Button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <PlayIcon className="h-4 w-4" />
                {isRunning ? "Ejecutando..." : "Ejecutar"}
              </Button>
            </div>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={exercise?.lesson?.module?.course?.programming_language.toLowerCase()}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Exercise;