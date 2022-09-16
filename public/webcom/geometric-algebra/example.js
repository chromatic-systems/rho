// Create a Clifford Algebra with 3 positive and one zero generator.
Algebra(3,0,1,()=>{
    
  // Output algebra info to the console.
  this.describe();
  
  // The default basis is 1,e0,e1,e2,e3,e01,e02,e03,e12,e13,e23,e012,e013,e023,e123,e0123
  // The metric for vectors is     0, 1, 1,  1          - Vectors will represent planes.
  // The metric for bivectors is   0, 0, 0, -1, -1, -1  - Bivectors will represent lines.
  // The metric for trivectors is  0, 0, 0, -1          - Trivectors will represent points.
  // The pseudoscalar is degenerate, so use the built-in duality operator instead.
  
  // The bivectors consist of three motor elements and three rotation element -
  // exactly what is needed to represent translations and rotations in euclidean space.
  
  // In dual projectivized space, the origin is represented by the e12 bivector.
  var origin=1e123, EX=-1e023, EY=1e013, EZ=-1e012;
  
  // Points and planes can be specified directly.
  var point = (x,y,z)=>origin+x*EX+y*EY+z*EZ,
      plane = (a,b,c,d)=>a*1e1+b*1e2+c*1e3+d*1e0;
  
  // Table from "Geometric Algebra for Computer Graphics" p.15
  var LineFromPoints            = (P,Q)=>P&Q,
      LineFromPlanes            = (a,b)=>a^b,
      PointFromPlanes           = (a,b,c)=>a^b^c,
      PlaneFromPoints           = (P,Q,R)=>P&Q&R,
      DistPointToPlane          = (a,P)=>a&P,
      DistPoints                = (P,Q)=>(P&Q).Length,
      AnglePlanes               = (a,b)=>Math.acos((a<<b).Length),
      LineThroughPointPerpPlane = (P,a)=>P<<a,
      OrthProjPointToPlane      = (P,a)=>P<<a*a,
      PlaneThroughPointParPlane = (P,a)=>P<<a*P,
      IntersectLinePlane        = (PI,a)=>PI^a,
      PlaneThroughPointPerpLine = (PI,P)=>P<<PI,
      OrthProjPointToLine       = (PI,P)=>P<<PI*PI,
      LineThroughPointParLine   = (PI,P)=>P<<PI*P,
      LineThroughPointPerpLine  = (PI,P)=>(P<<PI*P)&P,
      DistLines                 = (PI,EP)=>PI&EP,
      AngleLines                = (PI,EP)=>Math.acos((PI<<EP).Length),
      ReflectionInPlane         = (a,X)=>a*X*a,
      Rotor                     = (PI,alpha)=>Math.cos(alpha/2) + Math.sin(alpha/2)*PI,
      RotationAroundLine        = (X,PI,alpha)=>Rotor(PI,alpha)*X*~Rotor(PI,alpha),
      Translator                = (x,y,z)=>1+0.5*(x*EX+y*EY+z*EZ);
  
  // To demonstrate graphing, we create some points and lines.
  // Users can drag points in the graph, lambda expressions can be
  // used to create dynamic updating items.
  var A = point(-1,-1, 0), B = point(1,-1, 0), C = point(-1,1,0);
  
  // Ganja.js can directly graph 3D PGA elements. Pass in an array of
  // items to render. (numbers are colors, strings are labels, PGA points
  // and lines are rendered automatically and arrays can be used for line
  // segments and polygons). The graph function returns a HTML SVG element.
  document.body.appendChild(this.graph([
    // use numbers to set the current color.    
      0x444444,
    // strings label the items they follow, first string is a title.    
      "title",
    // render points (user can drag these)     
      A, B, C, "Label for point",
    // render lines    
      ()=>(B&C&A)<<(B&C)<<-A,"Label for line",
    // line segments
      ()=>[A,B], "Label for segment",
    // polygons
      0xffeeee,
      ()=>[A,B,C], 0xff7777, "Label for polygon"
  ],{grid:false, animate:false}));
  
  // When using the animation mode, all lambda's will be evaluated every frame.
  // Use Date.now() or similar. (many examples in the coffeeshop.)
});