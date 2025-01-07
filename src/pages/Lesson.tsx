import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const Lesson = () => {
  const { lessonId } = useParams();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          *,
          module:modules(
            *,
            course:courses(*)
          )
        `)
        .eq("id", lessonId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: userProgress } = useQuery({
    queryKey: ["userProgress", lessonId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const markAsCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para guardar tu progreso");
        return;
      }

      const { error } = await supabase
        .from("user_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
          points_earned: 10,
        });

      if (error) throw error;
      toast.success("¡Lección completada!");
    } catch (error) {
      console.error("Error al marcar como completada:", error);
      toast.error("Error al guardar el progreso");
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
        <h1 className="text-4xl font-bold mb-2">{lesson?.title}</h1>
        <p className="text-muted-foreground">
          {lesson?.module?.course?.title} &gt; {lesson?.module?.title}
        </p>
      </div>

      <Card className="p-6 mb-8">
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson?.content || "" }}
        />
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Lección anterior
        </Button>
        <Button
          onClick={markAsCompleted}
          disabled={userProgress?.completed}
          variant={userProgress?.completed ? "secondary" : "default"}
        >
          {userProgress?.completed ? "Completada" : "Marcar como completada"}
        </Button>
        <Button variant="outline">
          Siguiente lección
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Lesson;