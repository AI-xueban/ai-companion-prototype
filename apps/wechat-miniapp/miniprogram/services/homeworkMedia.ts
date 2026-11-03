import { homeworkMediaDurationError } from './homeworkGrading';

// Read local metadata only; do not autoplay or imply a cloud upload.
export async function validateHomeworkMedia(path:string,type:'video'|'audio'):Promise<void> {
  const seconds=type==='video'
    ? await new Promise<number>((resolve,reject)=>wx.getVideoInfo({src:path,success:r=>resolve(r.duration),fail:()=>reject(new Error('无法读取视频时长，请重新选择。'))}))
    : await new Promise<number>((resolve,reject)=>{
      const audio=wx.createInnerAudioContext();let done=false;
      const finish=(value?:number)=>{if(done)return;done=true;clearTimeout(timeout);clearInterval(poll);audio.destroy();value?resolve(value):reject(new Error('无法读取录音时长，请重新选择。'));};
      const check=()=>{if(Number.isFinite(audio.duration)&&audio.duration>0)finish(audio.duration);};
      const timeout=setTimeout(()=>finish(),4000),poll=setInterval(check,100);
      audio.autoplay=false;audio.onCanplay(check);audio.onError(()=>finish());audio.src=path;
    });
  const error=homeworkMediaDurationError(type,seconds);if(error)throw new Error(error);
}
