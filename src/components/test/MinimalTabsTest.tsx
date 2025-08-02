import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export function MinimalTabsTest() {
  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">Tabs Component Test</h2>
      
      <Tabs defaultValue="tab1" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tab1" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-md font-medium">Tab 1 Content</h3>
              <p className="text-sm text-gray-600">This is the first tab content.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tab2" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-md font-medium">Tab 2 Content</h3>
              <p className="text-sm text-gray-600">This is the second tab content.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tab3" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-md font-medium">Tab 3 Content</h3>
              <p className="text-sm text-gray-600">This is the third tab content.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}