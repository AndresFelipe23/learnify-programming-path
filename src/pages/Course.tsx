import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Code2, List } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  exercises: Exercise[];
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  initial_code: string | null;
  solution_code: string;
  test_cases: any;
  points: number;
}

const Course = () => {
  const { courseId } = useParams();

  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      return course;
    },
  });

  const { data: modules, isLoading: isLoadingModules } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: async () => {
      const { data: modules, error } = await supabase
        .from("modules")
        .select(`
          *,
          lessons:lessons(
            *,
            exercises:exercises(*)
          )
        `)
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      return modules as Module[];
    },
  });

  if (isLoadingCourse || isLoadingModules) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{course?.title}</h1>
        <p className="text-muted-foreground">{course?.description}</p>
      </div>

      {modules?.map((module) => (
        <Card key={module.id} className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              {module.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="lessons" className="w-full">
              <TabsList>
                <TabsTrigger value="lessons" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Lecciones
                </TabsTrigger>
                <TabsTrigger value="exercises" className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Ejercicios
                </TabsTrigger>
              </TabsList>
              <TabsContent value="lessons">
                <div className="space-y-4">
                  {module.lessons.map((lesson) => (
                    <Card key={lesson.id}>
                      <CardHeader>
                        <CardTitle>{lesson.title}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="exercises">
                <div className="space-y-4">
                  {module.lessons.flatMap((lesson) =>
                    lesson.exercises.map((exercise) => (
                      <Card key={exercise.id}>
                        <CardHeader>
                          <CardTitle>{exercise.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground mb-2">
                            {exercise.description}
                          </p>
                          <p className="text-sm text-primary">
                            Puntos: {exercise.points}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Course;