import { NextResponse } from "next/server";

export const dynamic="force-dynamic";

export async function GET(){
  const cloudName=process.env.CLOUDINARY_CLOUD_NAME;
  if(!cloudName) return NextResponse.json({photos:[],configured:false},{status:503});

  const url=`https://res.cloudinary.com/${cloudName}/image/list/cha-panela-2026.json?_=${Date.now()}`;
  try{
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok){
      return NextResponse.json({photos:[],configured:true,error:"gallery_not_available"},{status:502});
    }
    const data=await response.json() as {resources?:unknown[]};
    return NextResponse.json({photos:(data.resources||[]).reverse(),configured:true});
  }catch{
    return NextResponse.json({photos:[],configured:true,error:"gallery_not_available"},{status:502});
  }
}
